<script lang="ts">
	import { comparison } from '$lib/stores/comparison.svelte';
	import Messages from '$lib/components/Chat/Messages.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
	import FileUpIcon from '@lucide/svelte/icons/file-up';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import FileUploadPreview from '$lib/components/File/UploadPreview.svelte';
	import { fade } from 'svelte/transition';
	import { v7 as uuid } from 'uuid';
	import type { Message, AssistantMessage } from '$lib/types';
	import { fileToB64, handleFileUpload, mimeTypesAccept } from '$lib/files';
	import { toast } from 'svelte-sonner';
	import { onMount, tick } from 'svelte';
	import autosize from 'autosize';
	import { generateChatMessage } from '$lib/generator';
	import { getClientForRequest } from '$lib/mistral';
	import { apiKey } from '$lib/stores/apiKey';
	import { settings } from '$lib/stores/settings';
	import { models } from '$lib/stores/models.svelte';
	import { extractErrorContent } from '$lib/utils/error';
	import { emitter } from '$lib/emitter';
	import { get_encoding } from 'tiktoken';
	import type { TextChunk } from '@mistralai/mistralai/models/components';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import ArrowBigLeftIcon from '@lucide/svelte/icons/arrow-big-left';
	import ModelError from '$lib/components/ModelError.svelte';
	import EmptyState from '$lib/components/Chat/EmptyState.svelte';
	import type { ChatStore } from '$lib/stores/chat.svelte';
	import Options from '$lib/components/Chat/Options.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';

	const encoding = get_encoding('cl100k_base');

	let promptText = $state('');
	let files = $state<File[]>([]);
	let sides = $state({
		a: {
			loading: false,
			error: null as { text: string; body?: object } | null,
			abortController: null as AbortController | null
		},
		b: {
			loading: false,
			error: null as { text: string; body?: object } | null,
			abortController: null as AbortController | null
		}
	});
	let chatInput = $state<HTMLTextAreaElement | null>(null);
	let chatAExpanded = $state(false);
	let chatBExpanded = $state(false);

	const tokens = $derived(encoding.encode(promptText).length);
	const maxTokensA = $derived(
		models.chat.find((model) => model.id === comparison.chatA.state.options.model)?.maxContextLength ?? 32000
	);
	const maxTokensB = $derived(
		models.chat.find((model) => model.id === comparison.chatB.state.options.model)?.maxContextLength ?? 32000
	);

	function messageOrderIsValid(messages: Message[]) {
		if (messages.length === 0) {
			return true;
		}
		return messages.every((message, index) => {
			if (index === 0) {
				return message.role === 'user' || message.role === 'system';
			}
			return message.role !== 'system';
		});
	}

	const stateIsValidA = $derived(tokens <= maxTokensA && messageOrderIsValid(comparison.chatA.state.messages));
	const stateIsValidB = $derived(tokens <= maxTokensB && messageOrderIsValid(comparison.chatB.state.messages));

	function scrollDown(outputNode: HTMLElement | null | undefined) {
		if (outputNode) {
			outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
		}
	}

	async function generate(messages: Message[], answer: AssistantMessage, chatInstance: ChatStore, side: 'a' | 'b') {
		const outputNode = document.getElementById(`messages-container-${side}`);
		sides[side].loading = true;
		sides[side].error = null;

		const abortController = new AbortController();
		sides[side].abortController = abortController;
		const startedAt = performance.now();

		try {
			const client = getClientForRequest({ apiKey: $apiKey, endpoint: $settings.endpoint });

			await generateChatMessage({
				client,
				messages,
				answer,
				options: chatInstance.state.options,
				modelInfo: {
					id: chatInstance.model.id,
					reasoning: chatInstance.model.reasoning
				},
				abortSignal: abortController.signal,
				callbacks: {
					onChunk: () => {
						scrollDown(outputNode);
					},
					onComplete: (usage) => {
						const completionTime = performance.now() - startedAt;
						chatInstance.state.usage = usage;
						chatInstance.state.usage.tps = Math.round(usage.completionTokens / (completionTime / 1000));
						emitter.emit('message:complete');
						scrollDown(outputNode);
					}
				}
			});
		} catch (__error) {
			const _error = __error as Error;
			// Ignore abort errors
			if (!abortController.signal.aborted && _error.name !== 'AbortError') {
				if (!(answer.versions[answer.index].content[0] as TextChunk)?.text) {
					if (answer.versions.length === 1) {
						chatInstance.state.messages.pop();
					} else {
						answer.versions.splice(answer.index, 1);
						answer.index -= 1;
					}
				}
				sides[side].error = extractErrorContent(_error);
			}
		} finally {
			sides[side].loading = false;
		}
	}

	async function onSubmit(event?: Event) {
		event?.preventDefault();
		sides.a.error = null;
		sides.b.error = null;

		if (promptText.length || files.length) {
			const message: Message = {
				id: uuid(),
				index: 0,
				role: 'user',
				versions: [{ content: promptText.length ? [{ type: 'text', text: promptText }] : [] }]
			};
			if (files.length) {
				for (let index = 0; index < files.length; index++) {
					const file = files[index];
					if (file.type.includes('image/')) {
						message.versions[0].content.push({
							type: 'image_url' as const,
							imageUrl: await fileToB64(file)
						});
					} else {
						message.versions[0].content.push({
							type: 'document_url' as const,
							documentUrl: await fileToB64(file),
							documentName: file.name
						});
					}
				}
				files = [];
			}

			// Add message to both chats
			comparison.chatA.state.messages.push(JSON.parse(JSON.stringify(message)));
			comparison.chatB.state.messages.push(JSON.parse(JSON.stringify(message)));
			scrollDown(document.getElementById('messages-container-a'));
			scrollDown(document.getElementById('messages-container-b'));
		}
		promptText = '';

		// Prepare answers for both chats
		const messagesToSendA = JSON.parse(JSON.stringify(comparison.chatA.state.messages));
		const messagesToSendB = JSON.parse(JSON.stringify(comparison.chatB.state.messages));

		const answerA: Message = $state({
			id: uuid(),
			index: 0,
			role: 'assistant',
			versions: [{ content: [{ type: 'text', text: '' }] }]
		});

		const answerB: Message = $state({
			id: uuid(),
			index: 0,
			role: 'assistant',
			versions: [{ content: [{ type: 'text', text: '' }] }]
		});

		comparison.chatA.state.messages.push(answerA);
		comparison.chatB.state.messages.push(answerB);
		scrollDown(document.getElementById('messages-container-a'));
		scrollDown(document.getElementById('messages-container-b'));

		// Generate both in parallel
		await Promise.all([
			generate(messagesToSendA, answerA, comparison.chatA, 'a'),
			generate(messagesToSendB, answerB, comparison.chatB, 'b')
		]);
	}

	async function stopGenerating() {
		sides.a.loading = false;
		sides.a.abortController?.abort();
		sides.b.loading = false;
		sides.b.abortController?.abort();
	}

	function handleUploadedFiles(uploadedFiles: File[]) {
		const { files: validFiles, errors } = handleFileUpload(uploadedFiles);
		files.push(...validFiles);
		for (const error of errors) {
			toast.error(error);
		}
	}

	function onFileChange(
		event: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		}
	) {
		handleUploadedFiles(event.currentTarget.files ? Array.from(event.currentTarget.files) : []);
		event.currentTarget.files = null;
	}

	function onKeypress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			if (!isInvalid) {
				onSubmit();
				tick().then(() => {
					if (chatInput) {
						autosize.update(chatInput);
					}
				});
			}
		}
	}

	let isInvalid = $derived(
		sides.a.loading ||
			sides.b.loading ||
			models.loading ||
			!!models.error ||
			(!promptText &&
				(comparison.chatA.state.messages.length === 0 ||
					(comparison.chatA.state.messages.length > 0 &&
						comparison.chatA.state.messages[comparison.chatA.state.messages.length - 1].role !== 'user') ||
					comparison.chatB.state.messages.length === 0 ||
					(comparison.chatB.state.messages.length > 0 &&
						comparison.chatB.state.messages[comparison.chatB.state.messages.length - 1].role !== 'user')) &&
				files.length === 0)
	);

	// Message interaction functions
	async function createInteractionHandlers(chatInstance: ChatStore) {
		const side = chatInstance === comparison.chatA ? 'a' : 'b';
		return {
			moveUp: async (message: Message) => {
				const index = chatInstance.state.messages.findIndex((m) => m.id === message.id);
				if (index > 0) {
					chatInstance.state.messages.splice(index, 1);
					chatInstance.state.messages.splice(index - 1, 0, message);
				}
			},
			moveDown: async (message: Message) => {
				const index = chatInstance.state.messages.findIndex((m) => m.id === message.id);
				if (index >= 0 && index < chatInstance.state.messages.length - 1) {
					chatInstance.state.messages.splice(index, 1);
					chatInstance.state.messages.splice(index + 1, 0, message);
				}
			},
			refresh: async (message: Message) => {
				const index = chatInstance.state.messages.findIndex((m) => m.id === message.id);
				if (index >= 0) {
					if (chatInstance.state.messages[index].role === 'assistant') {
						chatInstance.state.messages[index].versions.push({ content: [{ type: 'text', text: '' }] });
						chatInstance.state.messages[index].index = chatInstance.state.messages[index].versions.length - 1;

						const messagesToSend = JSON.parse(JSON.stringify(chatInstance.state.messages.slice(0, index)));
						await generate(messagesToSend, chatInstance.state.messages[index], chatInstance, side);
					}
				}
			},
			previousVersion: async (message: Message) => {
				const index = chatInstance.state.messages.findIndex((m) => m.id === message.id);
				if (index >= 0) {
					if (chatInstance.state.messages[index].index > 0) {
						chatInstance.state.messages[index].index = chatInstance.state.messages[index].index - 1;
					}
				}
			},
			nextVersion: async (message: Message) => {
				const index = chatInstance.state.messages.findIndex((m) => m.id === message.id);
				if (index >= 0) {
					if (chatInstance.state.messages[index].index < chatInstance.state.messages[index].versions.length - 1) {
						chatInstance.state.messages[index].index = chatInstance.state.messages[index].index + 1;
					}
				}
			},
			deleteVersion: async (message: Message) => {
				const index = chatInstance.state.messages.findIndex((m) => m.id === message.id);
				if (index >= 0) {
					chatInstance.state.messages[index].versions.splice(chatInstance.state.messages[index].index);
					if (chatInstance.state.messages[index].index >= chatInstance.state.messages[index].versions.length - 1) {
						chatInstance.state.messages[index].index -= 1;
					}
				}
			},
			updateMessage: async (message: Message, role: any, content: any, thinking?: string) => {
				const index = chatInstance.state.messages.findIndex((m) => m.id === message.id);
				if (index >= 0) {
					const active = chatInstance.state.messages[index];
					active.role = role;
					if (active.role === 'assistant') {
						active.versions[active.index].thinking = thinking;
					} else {
						delete (active.versions[active.index] as any).thinking;
					}
					active.versions[active.index].content = content;
				}
			},
			deleteMessage: async (message: Message) => {
				const index = chatInstance.state.messages.findIndex((m) => m.id === message.id);
				if (index >= 0) {
					chatInstance.state.messages.splice(index, 1);
				}
			},
			generate: async () => {
				const messagesToSend = JSON.parse(JSON.stringify(chatInstance.state.messages));
				const answer: Message = $state({
					id: uuid(),
					index: 0,
					role: 'assistant',
					versions: [{ content: [{ type: 'text', text: '' }] }]
				});
				chatInstance.state.messages.push(answer);
				await generate(messagesToSend, answer, chatInstance, side);

				// TODO generate the opposite side if it can be generated ?
			}
		};
	}

	const interactA = $derived(createInteractionHandlers(comparison.chatA));
	const interactB = $derived(createInteractionHandlers(comparison.chatB));

	// Sync options
	$effect(() => {
		comparison.chatA.state.options;
		comparison.chatB.state.options;
		comparison.syncOptions();
	});

	onMount(() => {
		comparison.setup();
	});
</script>

<div class="flex h-full max-h-[calc(100svh-80px)] flex-col gap-2">
	<div class="flex min-h-0 flex-1 flex-row gap-4">
		<div class="flex min-h-0 flex-1 flex-col gap-2">
			<div class="bg-card relative flex shrink-0 flex-col gap-2 rounded-lg border p-3 pb-5">
				<Options
					bind:expanded={chatAExpanded}
					options={comparison.chatA.state.options}
					compact
					onExpand={(expanded) => {
						if (!expanded && comparison.state.syncOptions) {
							chatBExpanded = false;
						}
					}}
				>
					{#snippet insideContent()}
						<div class="flex items-center gap-2">
							<label for="sync-settings" class="text-muted-foreground text-xs">Sync settings</label>
							<Switch id="sync-settings" bind:checked={comparison.state.syncOptions} />
						</div>
					{/snippet}
				</Options>
			</div>
			<div class="mt-4 flex min-h-0 flex-1 flex-col gap-2">
				<div class="min-h-0 flex-1 overflow-y-auto" id="messages-container-a">
					{#if comparison.chatA.state.messages.length}
						{#await interactA then handlers}
							<Messages
								messages={comparison.chatA.state.messages}
								interact={handlers}
								loading={sides.a.loading}
								error={sides.a.error}
							/>
						{/await}
					{:else}
						<EmptyState />
					{/if}
				</div>
				{#if comparison.chatA.state.usage}
					<div class="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
						<Badge variant="outline">Tokens</Badge>
						<div>
							Prompt: {comparison.chatA.state.usage.promptTokens} / Completion:
							{comparison.chatA.state.usage.completionTokens}
							{#if comparison.chatA.state.usage.tps}
								({comparison.chatA.state.usage.tps} tk/s)
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
		<div class="bg-muted w-px"></div>
		<div class="flex min-h-0 flex-1 flex-col gap-2">
			<div class="bg-card relative flex shrink-0 flex-col gap-2 rounded-lg border p-3 pb-5">
				{#snippet chatBSyncedOptions()}
					<Alert.Root>
						<ArrowBigLeftIcon />
						<Alert.Description>
							Options are synced from the chat options on the left, unsync options to change them for this chat.
						</Alert.Description>
					</Alert.Root>
				{/snippet}
				<Options
					bind:expanded={chatBExpanded}
					options={comparison.chatB.state.options}
					compact
					content={comparison.state.syncOptions ? chatBSyncedOptions : undefined}
					onExpand={(expanded) => {
						if (expanded && comparison.state.syncOptions) {
							chatAExpanded = true;
						}
					}}
				>
					{#snippet insideContent()}
						<div class="flex items-center gap-2">
							<label for="sync-settings" class="text-muted-foreground text-xs">Sync settings</label>
							<Switch id="sync-settings" bind:checked={comparison.state.syncOptions} />
						</div>
					{/snippet}
				</Options>
			</div>
			<div class="mt-4 flex min-h-0 flex-1 flex-col gap-2">
				<div class="min-h-0 flex-1 overflow-y-auto" id="messages-container-b">
					{#if comparison.chatB.state.messages.length}
						{#await interactB then handlers}
							<Messages
								messages={comparison.chatB.state.messages}
								interact={handlers}
								loading={sides.b.loading}
								error={sides.b.error}
							/>
						{/await}
					{:else}
						<EmptyState />
					{/if}
				</div>
				{#if comparison.chatB.state.usage}
					<div class="text-muted-foreground flex shrink-0 items-center gap-2 text-xs">
						<Badge variant="outline">Tokens</Badge>
						<div>
							Prompt: {comparison.chatB.state.usage.promptTokens} / Completion:
							{comparison.chatB.state.usage.completionTokens}
							{#if comparison.chatB.state.usage.tps}
								({comparison.chatB.state.usage.tps} tk/s)
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<form class="flex shrink-0 flex-col gap-2 px-2 lg:px-4 xl:mx-auto xl:w-3/5" onsubmit={onSubmit}>
		{#if !stateIsValidA || !stateIsValidB}
			<Alert.Root variant="destructive">
				<AlertCircleIcon />
				<Alert.Description>
					<p>
						Your input is invalid, the first message can only be a system prompt or a question and the last message must
						be a question or system prompt.
					</p>
				</Alert.Description>
			</Alert.Root>
		{/if}
		<ModelError />
		<label class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<span></span>
				</div>
				{#if tokens > 0}
					<span class="text-xs" transition:fade>
						~<span class="text-stone-300">{tokens}</span> tokens
					</span>
				{/if}
			</div>
			<div class="relative">
				<Textarea
					bind:ref={chatInput}
					rows={5}
					readonly={sides.a.loading || sides.b.loading || !!models.error}
					placeholder="Type something or drag and drop images..."
					onkeypress={onKeypress}
					bind:value={promptText}
				/>
			</div>
		</label>
		{#if files.length}
			<div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
				{#each files as file, index}
					<FileUploadPreview
						{file}
						loading={sides.a.loading || sides.b.loading}
						remove={() => files.splice(index, 1)}
					/>
				{/each}
			</div>
		{/if}
		<div class="flex flex-row justify-between">
			<div class="flex flex-row items-center gap-2">
				{#if comparison.chatA.model?.capabilities.vision && comparison.chatB.model?.capabilities.vision}
					<label for="fileUpload">
						<input
							id="fileUpload"
							class="hidden"
							type="file"
							multiple
							accept={mimeTypesAccept}
							disabled={sides.a.loading || sides.b.loading || models.loading || !!models.error}
							onchange={onFileChange}
						/>
						<Button
							variant="secondary"
							disabled={sides.a.loading || sides.b.loading || models.loading || !!models.error}
							onclick={() => document.getElementById('fileUpload')?.click()}
						>
							<FileUpIcon size={20} />
							<span class="hidden md:inline-block">Upload file</span>
						</Button>
					</label>
				{/if}
			</div>
			<div class="flex flex-row gap-2">
				{#if sides.a.loading || sides.b.loading}
					<Button
						variant="destructive"
						onclick={() => {
							stopGenerating();
						}}
					>
						Stop All
					</Button>
				{:else}
					<Button type="submit" disabled={isInvalid}>
						Submit
						<SendHorizontalIcon />
					</Button>
				{/if}
			</div>
		</div>
	</form>
</div>
