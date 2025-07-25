<script lang="ts">
	import { fade } from 'svelte/transition';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/stores/apiKey';
	import type { Usage, Message, AssistantMessage, MessageRole, MessageContent } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Messages from '$lib/components/Chat/Messages.svelte';
	import { settings } from '$lib/stores/settings';
	import { onDestroy, onMount, tick } from 'svelte';
	import { chat } from '$lib/stores/chat.svelte';
	import { v7 as uuid } from 'uuid';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import FileUpIcon from '@lucide/svelte/icons/file-up';
	import { loadModels, models } from '$lib/stores/models.svelte';
	import { getClientForRequest } from '$lib/mistral';
	import ModelError from '$lib/components/ModelError.svelte';
	import { defaultChatModel } from '$lib/const';
	import { fileToB64, handleFileUpload, mimeTypesAccept } from '$lib/files';
	import FileUploadPreview from '$lib/components/File/UploadPreview.svelte';
	import type { ChatCompletionStreamRequest, TextChunk } from '@mistralai/mistralai/models/components';
	import { editing } from '$lib/stores/editing.svelte';
	import { db } from '$lib/stores/db';
	import { toast } from 'svelte-sonner';
	import Button from '$lib/components/ui/button/button.svelte';
	import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Options from './Options.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import { emitter } from '$lib/emitter';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';
	import autosize from 'autosize';
	import { extractErrorContent } from '$lib/utils/error';

	if (browser && !$apiKey) {
		goto('/', { replaceState: true });
	}

	const encoding = get_encoding('cl100k_base');

	let promptText = $state('');
	let isDragging = $state(false);
	let dragCounter = $state(0);
	let files = $state<File[]>([]);

	let error: { text: string; body?: object } | null = $state(null);

	$effect(() => {
		chat.state.id;
		editing.id = '';
		files = [];
		error = null;
	});

	const unsubscribe = settings.subscribe((value) => {
		if (chat.state.messages.length === 0) {
			chat.state.options.temperature = value.temperature;
			chat.state.options.seed = value.seed ? Number(value.seed) : undefined;
		}
	});

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

	const tokens = $derived(encoding.encode(promptText).length);
	const maxTokens = $derived(
		models.chat.find((model) => model.id === chat.state.options.model)?.maxContextLength ?? 32000
	);
	const stateIsValid = $derived(tokens <= maxTokens && messageOrderIsValid(chat.state.messages));

	async function removeFromHistory() {
		await db.chat.delete(chat.state.id);
	}

	async function updateOrInsertHistory() {
		await db.chat.put({
			id: chat.state.id,
			messages: JSON.parse(JSON.stringify(chat.state.messages)),
			usage: chat.state.usage ? JSON.parse(JSON.stringify(chat.state.usage)) : undefined,
			options: JSON.parse(JSON.stringify(chat.state.options))
		});
	}

	let loading = $state(false);
	let abortController: AbortController | null = null;

	function scrollDown(outputNode: HTMLElement | null | undefined) {
		if (outputNode) {
			outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			// const thinkBlock = document.getElementById('messages-container')!.querySelector('div:last-of-type think');
			// if (thinkBlock) {
			// 	thinkBlock.scroll({ top: thinkBlock.scrollHeight, behavior: 'smooth' });
			// }
		}
	}

	async function generate(messages: Message[], answer: AssistantMessage) {
		const outputNode = document.getElementById('messages-container')?.parentElement;
		loading = true;

		abortController = new AbortController();
		const startedAt = performance.now();
		try {
			const client = getClientForRequest({ apiKey: $apiKey, endpoint: $settings.endpoint });
			const finalMessages: ChatCompletionStreamRequest['messages'] = messages.map((message) => {
				// Useless condition to avoid type errors
				if (message.role === 'user') {
					return {
						role: message.role,
						content: message.versions[message.index].content
					};
				} else if (message.role === 'assistant') {
					const content = message.versions[message.index].content;
					if (chat.model.reasoning && message.versions[message.index].thinking) {
						// Sadly we need to check for this model specifically to re-insert the <think> tag
						if (chat.model.id === 'magistral-medium-2506') {
							const firstChunkText = content.find((c) => c.type === 'text');
							if (firstChunkText) {
								firstChunkText.text = `<think>${message.versions[message.index].thinking}</think>\n${firstChunkText.text}`;
							}
						} else {
							content.unshift({
								type: 'thinking',
								thinking: [{ type: 'text', text: message.versions[message.index].thinking! }]
							});
						}
					}
					return { role: message.role, content };
				}
				return {
					role: message.role,
					content: message.versions[message.index].content
				};
			});
			if (chat.state.options.systemPrompt) {
				finalMessages.unshift({ role: 'system', content: chat.state.options.systemPrompt! });
			}
			const chatStreamResponse = await client.chat.stream(
				{
					model: chat.state.options.model ? chat.state.options.model : defaultChatModel,
					messages: finalMessages,
					maxTokens: typeof chat.state.options.maxTokens === 'number' ? chat.state.options.maxTokens : undefined,
					randomSeed: typeof chat.state.options.seed === 'number' ? chat.state.options.seed : undefined,
					responseFormat: chat.state.options.json ? { type: 'json_object' } : undefined,
					safePrompt: chat.state.options.safePrompt,
					temperature: chat.state.options.temperature,
					topP: chat.state.options.topP,
					frequencyPenalty: chat.state.options.frequencyPenalty,
					presencePenalty: chat.state.options.presencePenalty
				},
				{ fetchOptions: { signal: abortController.signal } }
			);
			if (chat.model.reasoning) {
				answer.versions[answer.index].thinking = '';
			}
			let reasoningStep = chat.model.id === 'magistral-medium-2506' ? 0 : 2;
			let reasoningBuffer = '';
			for await (const message of chatStreamResponse) {
				const data = message.data;
				if (data.choices[0].delta.content !== undefined) {
					const content = data.choices[0].delta.content;
					if (Array.isArray(content)) {
						for (let index = 0; index < content.length; index++) {
							const entry = content[index];
							if (entry.type === 'text') {
								(answer.versions[answer.index].content[index] as TextChunk).text += entry.text;
							} else if (entry.type === 'thinking') {
								for (let j = 0; j < entry.thinking.length; j++) {
									const block = entry.thinking[j];
									if (block.type === 'text') {
										answer.versions[answer.index].thinking += block.text;
									} else {
										console.log('unsupported content in chunk', entry, block);
									}
								}
							} else {
								console.log('unsupported chunk content', entry);
							}
						}
					} else {
						// If the model is reasoning (in the old way with <think> blocks), we add a special logic to convert it to the new way
						if (chat.model.reasoning && reasoningStep < 2) {
							if (!content) {
								continue;
							}
							reasoningBuffer += content;
							if (reasoningStep === 0) {
								const start = reasoningBuffer.indexOf('<think>');
								if (start >= 0) {
									reasoningBuffer = reasoningBuffer.slice(start + 7).trim();
									reasoningStep = 1;
									if (reasoningBuffer.length) {
										answer.versions[answer.index].thinking = reasoningBuffer;
									}
								}
							} else if (reasoningStep === 1) {
								const end = reasoningBuffer.indexOf('</think>');
								if (end >= 0) {
									answer.versions[answer.index].thinking += reasoningBuffer.slice(0, end);
									answer.versions[answer.index].thinking = answer.versions[answer.index].thinking?.trim();
									reasoningStep = 2;
									reasoningBuffer = reasoningBuffer.slice(end + 8).trim();
									if (reasoningBuffer.length) {
										(answer.versions[answer.index].content[0] as TextChunk).text += reasoningBuffer;
									}
								} else {
									answer.versions[answer.index].thinking += content;
								}
							}
						} else {
							(answer.versions[answer.index].content[0] as TextChunk).text += content ?? '';
						}
					}
				}
				if (data.usage) {
					const completionTime = performance.now() - startedAt;
					chat.state.usage = {
						promptTokens: data.usage.promptTokens ?? 0,
						completionTokens: data.usage.completionTokens ?? 0,
						totalTokens: data.usage.totalTokens ?? 0
					};
					chat.state.usage.tps = Math.round(Number((data.usage as Usage).completionTokens / (completionTime / 1000)));
				}
				scrollDown(outputNode);
			}
			if (!abortController.signal.aborted) {
				if (chat.state.options.json && answer.versions[answer.index].content[0].type === 'text') {
					(answer.versions[answer.index].content[0] as TextChunk).text =
						`\`\`\`json\n${JSON.stringify(JSON.parse((answer.versions[answer.index].content[0] as TextChunk).text), undefined, 4)}\n\`\`\``;
				}
			}
			emitter.emit('message:complete');
			scrollDown(outputNode);
		} catch (__error) {
			const _error = __error as Error;
			// Ignore abort errors
			if (!abortController.signal.aborted && _error.name !== 'AbortError') {
				if (!(answer.versions[answer.index].content[0] as TextChunk)?.text) {
					if (answer.versions.length === 1) {
						chat.state.messages.pop();
					} else {
						answer.versions.splice(answer.index, 1);
						answer.index -= 1;
					}
				}
				error = extractErrorContent(_error);
			}
		} finally {
			loading = false;
			if (chat.state.messages.length) {
				await updateOrInsertHistory();
			}
		}
	}

	async function onSubmit(event?: Event) {
		const outputNode = document.getElementById('messages-container');
		event?.preventDefault();
		error = null;
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
			chat.state.messages.push(message);
			scrollDown(outputNode);
		}
		promptText = '';

		// Take the messages up to here for the next generation
		const messagesToSend = JSON.parse(JSON.stringify(chat.state.messages));
		const answer: Message = $state({
			id: uuid(),
			index: 0,
			role: 'assistant',
			versions: [{ content: [{ type: 'text', text: '' }] }]
		});
		chat.state.messages.push(answer);
		scrollDown(outputNode);

		await generate(messagesToSend, answer);
	}

	async function stopGenerating(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		loading = false;
		abortController?.abort();
	}

	// * > Message events

	async function moveUp(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index > 0) {
			chat.state.messages.splice(index, 1);
			chat.state.messages.splice(index - 1, 0, message);
			await updateOrInsertHistory();
		}
	}

	async function moveDown(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0 && index < chat.state.messages.length - 1) {
			chat.state.messages.splice(index, 1);
			chat.state.messages.splice(index + 1, 0, message);
			await updateOrInsertHistory();
		}
	}

	async function refresh(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			if (chat.state.messages[index].role === 'assistant') {
				chat.state.messages[index].versions.push({ content: [{ type: 'text', text: '' }] });
				chat.state.messages[index].index = chat.state.messages[index].versions.length - 1;

				// Take the messages up to the answer we need to re-generate
				const messagesToSend = JSON.parse(JSON.stringify(chat.state.messages.slice(0, index)));
				await generate(messagesToSend, chat.state.messages[index]);
			}
		}
	}

	async function previousVersion(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			if (chat.state.messages[index].index > 0) {
				chat.state.messages[index].index = chat.state.messages[index].index - 1;
				await updateOrInsertHistory();
			}
		}
	}

	async function nextVersion(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			if (chat.state.messages[index].index < chat.state.messages[index].versions.length - 1) {
				chat.state.messages[index].index = chat.state.messages[index].index + 1;
				await updateOrInsertHistory();
			}
		}
	}

	async function deleteVersion(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			chat.state.messages[index].versions.splice(chat.state.messages[index].index);
			if (chat.state.messages[index].index >= chat.state.messages[index].versions.length - 1) {
				chat.state.messages[index].index -= 1;
			}
			await updateOrInsertHistory();
		}
	}

	async function updateMessage(message: Message, role: MessageRole, content: MessageContent, thinking?: string) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			const active = chat.state.messages[index];
			active.role = role;
			if (active.role === 'assistant') {
				active.versions[active.index].thinking = thinking;
			} else {
				// @ts-expect-error We delete the value since it should not exists
				delete active.versions[active.index].thinking;
			}
			active.versions[active.index].content = content;
			await updateOrInsertHistory();
		}
	}

	async function deleteMessage(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			chat.state.messages.splice(index, 1);
			if (chat.state.messages.length === 0) {
				await removeFromHistory();
			} else {
				await updateOrInsertHistory();
			}
		}
	}

	// * < Message events

	let isInvalid = $derived(
		loading ||
			models.loading ||
			!!models.error ||
			(!promptText &&
				(chat.state.messages.length === 0 ||
					(chat.state.messages.length > 0 && chat.state.messages[chat.state.messages.length - 1].role !== 'user')) &&
				files.length === 0)
	);

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

	let chatInput = $state<HTMLTextAreaElement | null>(null);
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

	onMount(() => {
		loadModels();

		// Add file drag and drop event listeners
		const handleDragEnter = (e: DragEvent) => {
			if (editing.id) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();
			if (e.dataTransfer?.types.includes('Files')) {
				dragCounter++;
				isDragging = true;
			}
		};

		const handleDragLeave = (e: DragEvent) => {
			if (editing.id) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();
			dragCounter--;
			if (dragCounter === 0) {
				isDragging = false;
			}
		};

		const handleDragOver = (e: DragEvent) => {
			if (editing.id) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();
		};

		const handleDrop = (e: DragEvent) => {
			if (!chat.model.capabilities.vision) {
				e.preventDefault();
				e.stopPropagation();
				dragCounter = 0;
				isDragging = false;
				return toast.error('This model does not support multimedia content.');
			}
			if (editing.id) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			dragCounter = 0;
			isDragging = false;

			if (e.dataTransfer?.files) {
				return handleUploadedFiles(e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []);
			}
			return null;
		};

		window.addEventListener('dragenter', handleDragEnter);
		window.addEventListener('dragleave', handleDragLeave);
		window.addEventListener('dragover', handleDragOver);
		window.addEventListener('drop', handleDrop);

		// Cleanup function
		return () => {
			window.removeEventListener('dragenter', handleDragEnter);
			window.removeEventListener('dragleave', handleDragLeave);
			window.removeEventListener('dragover', handleDragOver);
			window.removeEventListener('drop', handleDrop);
		};
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class="flex max-h-[calc(100svh-80px)] shrink grow flex-row gap-0">
	<Options class="hidden lg:flex" />
	<div class="relative flex h-full w-[calc(75vw-4rem-var(--sidebar-width))] flex-1 flex-col gap-4">
		<div class="flex-1 overflow-y-auto px-2 lg:px-4">
			{#if chat.state.messages.length}
				<Messages
					messages={chat.state.messages}
					interact={{
						moveUp,
						moveDown,
						refresh,
						previousVersion,
						nextVersion,
						deleteVersion,
						updateMessage,
						deleteMessage,
						generate: onSubmit
					}}
					{loading}
					{error}
				/>
			{:else}
				<div
					class="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-3 text-center"
					style="background: radial-gradient(circle,rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 30%) ;"
				>
					<MessageSquareMoreIcon size={52} />
					<p class="text-muted-foreground leading-7">Your messages will appear here...</p>
				</div>
			{/if}
		</div>
		<form class="flex shrink-0 flex-col gap-2 lg:px-4" onsubmit={onSubmit}>
			{#if !stateIsValid}
				<Alert.Root variant="destructive">
					<AlertCircleIcon />
					<Alert.Description>
						<p>
							Your input is invalid, the first message can only be a system prompt or a question and the last message
							must be a question or system prompt.
						</p>
					</Alert.Description>
				</Alert.Root>
			{/if}
			<ModelError />
			<label class="flex flex-col gap-1.5">
				<div class="flex items-center justify-between gap-2">
					<div class="flex items-center gap-2">
						{#if chat.state.usage}
							<div class="text-foreground flex items-center gap-2 text-right text-xs opacity-75">
								<Badge>Tokens</Badge>
								<div>
									Prompt: <span class="text-muted-background">{chat.state.usage.promptTokens}</span> / Completion:
									<span class="text-muted-background">{chat.state.usage.completionTokens}</span>
									/ Total: <span class="text-muted-background">{chat.state.usage.totalTokens}</span>
								</div>
								{#if chat.state.usage.tps}
									<div>
										<span class="text-muted-background">(</span>{chat.state.usage.tps}
										<span class="text-muted-background">tk/s</span><span class="text-muted-background">)</span>
									</div>
								{/if}
								<span></span>
							</div>
						{:else}
							<span></span>
						{/if}
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
						readonly={loading || !!models.error}
						placeholder="Type something or drag and drop images..."
						onkeypress={onKeypress}
						bind:value={promptText}
					/>
					{#if isDragging}
						<div
							class="dropzone textarea !border-primary-500 rounded-container-token absolute top-0 right-0 bottom-0 left-0 flex flex-row items-center gap-2 border-2 border-dashed p-4 py-4"
						>
							<div class="shrink-0 grow-0">
								<FileTextIcon class="mx-auto" size="32" />
							</div>
							<div class="flex shrink grow flex-col gap-1">
								<div class="flex shrink grow flex-col gap-1">
									<span class="label-text"><strong>Drop a file</strong></span>
								</div>
								<span>Images (.png, .jpeg, .jpg, .webp and .avif), PDF, text and documents files allowed.</span>
							</div>
						</div>
					{/if}
				</div>
			</label>
			{#if files.length}
				<div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
					{#each files as file, index}
						<FileUploadPreview {file} {loading} remove={() => files.splice(index, 1)} />
					{/each}
				</div>
			{/if}
			<div class="flex flex-row justify-between">
				<div class="flex flex-row items-center gap-2">
					<Drawer.Root direction="right">
						<Drawer.Trigger class="block lg:hidden" type="button" onclick={(event) => event.stopImmediatePropagation()}>
							<SlidersHorizontalIcon size={20} />
						</Drawer.Trigger>
						<Drawer.Content class="flex max-h-screen overflow-auto p-4">
							<Options />
						</Drawer.Content>
					</Drawer.Root>
					{#if chat.model?.capabilities.vision}
						<label for="fileUpload">
							<input
								id="fileUpload"
								class="hidden"
								type="file"
								multiple
								accept={mimeTypesAccept}
								disabled={loading || models.loading || !!models.error}
								onchange={onFileChange}
							/>
							<Button
								variant="secondary"
								disabled={loading || models.loading || !!models.error}
								onclick={() => document.getElementById('fileUpload')?.click()}
							>
								<FileUpIcon size={20} />
								<span class="hidden md:inline-block">Upload file</span>
							</Button>
						</label>
					{/if}
				</div>
				<div class="flex flex-row gap-2">
					{#if loading}
						<Button variant="destructive" onclick={stopGenerating}>Stop</Button>
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
</div>
