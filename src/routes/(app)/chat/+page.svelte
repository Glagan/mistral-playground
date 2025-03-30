<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import {
		SlideToggle,
		focusTrap,
		type ModalComponent,
		type ModalSettings,
		getModalStore
	} from '@skeletonlabs/skeleton';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/stores/apiKey';
	import type { Usage, Message, AssistantMessage, MessageDetails, MessageRole, MessageContent } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { history } from '$lib/stores/history';
	import Messages from '$lib/components/Messages.svelte';
	import { settings } from '$lib/stores/settings';
	import { onDestroy, onMount } from 'svelte';
	import { chat } from '$lib/stores/chat.svelte';
	import { v4 as uuid } from 'uuid';
	import Settings2Icon from 'lucide-svelte/icons/settings-2';
	import CircleHelpIcon from 'lucide-svelte/icons/circle-help';
	import FileTextIcon from 'lucide-svelte/icons/file-text';
	import { loadModels, models } from '$lib/stores/models.svelte';
	import { getClientForRequest } from '$lib/mistral';
	import ModelError from '$lib/components/ModelError.svelte';
	import ShareModal from '$lib/components/ShareModal.svelte';
	import { defaultChatModel } from '$lib/const';
	import { fileToB64, handleFileUpload } from '$lib/files';
	import FileUploadPreview from '$lib/components/FileUploadPreview.svelte';
	import type { TextChunk } from '@mistralai/mistralai/models/components';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { editing } from '$lib/stores/editing.svelte';

	if (browser && !$apiKey) {
		goto('/', { replaceState: true });
	}

	const encoding = get_encoding('cl100k_base');
	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let showOptions = $state(false);
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
			chat.state.options.randomSeed = value.seed ? Number(value.seed) : undefined;
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
	let systemPrompt = $state('');
	const systemPromptTokens = $derived(encoding.encode(systemPrompt).length);
	const maxTokens = $derived(
		models.chat.find((model) => model.id === chat.state.options.model)?.maxContextLength ?? 32000
	);
	const stateIsValid = $derived(tokens <= maxTokens && messageOrderIsValid(chat.state.messages));

	function removeFromHistory() {
		$history.chat = $history.chat.filter((e) => e.id !== chat.state.id);
		$history.chat = $history.chat;
	}

	function updateOrInsertHistory() {
		$history.chat = $history.chat.filter((e) => e.id !== chat.state.id);
		$history.chat.splice(0, 0, {
			id: chat.state.id,
			messages: JSON.parse(JSON.stringify(chat.state.messages)),
			usage: chat.state.usage ? JSON.parse(JSON.stringify(chat.state.usage)) : undefined,
			options: JSON.parse(JSON.stringify(chat.state.options))
		});
		$history.chat = $history.chat;
	}

	let loading = $state(false);
	let abortController: AbortController | null = null;

	async function generate(messages: Message[], answer: AssistantMessage) {
		const outputNode = document.getElementById('messages-container');
		loading = true;
		showOptions = false;

		abortController = new AbortController();
		const startedAt = performance.now();
		try {
			const client = getClientForRequest({ apiKey: $apiKey, endpoint: $settings.endpoint });
			const chatStreamResponse = await client.chat.stream(
				{
					model: chat.state.options.model ? chat.state.options.model : defaultChatModel,
					messages: messages.map((message) => {
						// Useless condition to avoid type errors
						if (message.role === 'user') {
							return {
								role: message.role,
								content: message.versions[message.index].content
							};
						} else if (message.role === 'assistant') {
							return {
								role: message.role,
								content: message.versions[message.index].content
							};
						}
						return {
							role: message.role,
							content: message.versions[message.index].content
						};
					}),
					maxTokens: typeof chat.state.options.maxTokens === 'number' ? chat.state.options.maxTokens : undefined,
					randomSeed: typeof chat.state.options.randomSeed === 'number' ? chat.state.options.randomSeed : undefined,
					responseFormat: chat.state.options.json ? { type: 'json_object' } : undefined,
					safePrompt: chat.state.options.safePrompt,
					temperature: chat.state.options.temperature,
					topP: chat.state.options.topP
				},
				{ fetchOptions: { signal: abortController.signal } }
			);
			for await (const message of chatStreamResponse) {
				const data = message.data;
				if (data.choices[0].delta.content !== undefined) {
					const text = data.choices[0].delta.content;
					(answer.versions[answer.index].content[0] as TextChunk).text += text ?? '';
				}
				if (data.usage) {
					const completionTime = performance.now() - startedAt;
					chat.state.usage = data.usage;
					chat.state.usage.tps = Math.round(Number((data.usage as Usage).completionTokens / (completionTime / 1000)));
				}
				if (outputNode) {
					outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
				}
			}
			if (!abortController.signal.aborted) {
				if (chat.state.options.json && answer.versions[answer.index].content[0].type === 'text') {
					(answer.versions[answer.index].content[0] as TextChunk).text =
						`\`\`\`json\n${JSON.stringify(JSON.parse((answer.versions[answer.index].content[0] as TextChunk).text), undefined, 4)}\n\`\`\``;
				}
			}
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
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
				const responseBody = _error.message.match(/([\s\S]+?)({[\s\S]+?})/is);
				if (responseBody) {
					try {
						const body = JSON.parse(responseBody[2].trim());
						error = { text: `Failed to generate: ${responseBody[1].trim()}`, body };
					} catch (jsonError) {
						error = { text: `Failed to generate: ${_error.message}` };
					}
				} else {
					error = { text: `Failed to generate: ${_error.message}` };
				}
			}
		} finally {
			loading = false;
			if (chat.state.messages.length) {
				updateOrInsertHistory();
			}
		}
	}

	async function onSubmit(event: Event) {
		const outputNode = document.getElementById('messages-container');
		event.preventDefault();
		error = null;
		if (systemPrompt) {
			chat.state.messages.push({
				id: uuid(),
				index: 0,
				role: 'system',
				versions: [{ content: [{ type: 'text', text: systemPrompt }] }]
			});
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
		}
		if (promptText.length) {
			const message: Message = {
				id: uuid(),
				index: 0,
				role: 'user',
				versions: [{ content: [{ type: 'text', text: promptText }] }]
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
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
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
		if (outputNode) {
			outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
		}

		await generate(messagesToSend, answer);
	}

	async function addSystemPrompt(event: Event) {
		event.preventDefault();
		if (systemPrompt) {
			chat.state.messages.push({
				id: uuid(),
				index: 0,
				role: 'system',
				versions: [{ content: [{ type: 'text', text: systemPrompt }] }]
			});
			systemPrompt = '';
			showOptions = false;
		}
	}

	async function stopGenerating(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		loading = false;
		abortController?.abort();
	}

	// * > Message events

	function moveUp(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index > 0) {
			chat.state.messages.splice(index, 1);
			chat.state.messages.splice(index - 1, 0, message);
			updateOrInsertHistory();
		}
	}

	function moveDown(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0 && index < chat.state.messages.length - 1) {
			chat.state.messages.splice(index, 1);
			chat.state.messages.splice(index + 1, 0, message);
			updateOrInsertHistory();
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
				updateOrInsertHistory();
			}
		}
	}

	async function nextVersion(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			if (chat.state.messages[index].index < chat.state.messages[index].versions.length - 1) {
				chat.state.messages[index].index = chat.state.messages[index].index + 1;
				updateOrInsertHistory();
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
			updateOrInsertHistory();
		}
	}

	function updateMessage(message: Message, role: MessageRole, content: MessageContent) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			const active = chat.state.messages[index];
			active.role = role;
			active.versions[active.index].content = content;
			updateOrInsertHistory();
		}
	}

	function deleteMessage(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			chat.state.messages.splice(index, 1);
			if (chat.state.messages.length === 0) {
				removeFromHistory();
			} else {
				updateOrInsertHistory();
			}
		}
	}

	// * < Message events

	function openShare() {
		const modalComponent: ModalComponent = { ref: ShareModal };
		const settingsModal: ModalSettings = {
			type: 'component',
			backdropClasses: 'bg-gradient-to-tr from-surface-800/50 via-primary-800/50 to-secondary-800/50',
			component: modalComponent
		};
		modalStore.trigger(settingsModal);
	}

	function handleUploadedFiles(uploadedFiles: File[]) {
		const { files: validFiles, errors } = handleFileUpload(uploadedFiles);
		files.push(...validFiles);
		for (const error of errors) {
			toastStore.trigger({ message: error, background: 'variant-filled-warning' });
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

<div
	class="flex flex-grow flex-shrink justify-center items-stretch flex-col gap-4 p-4 max-h-[calc(100vh-88px)] lg:max-h-screen"
>
	<div class="relative flex-grow flex-shrink w-full overflow-auto">
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
			{#if loading}
				<button
					class="block btn variant-ghost-error transition-all mx-auto mt-4"
					type="button"
					transition:slide={{ axis: 'y' }}
					onclick={stopGenerating}
				>
					Stop
				</button>
			{/if}
		{:else}
			<div class="flex justify-center items-center flex-grow flex-shrink w-full overflow-auto"></div>
		{/if}
		<div class="h-4 bg-gradient-to-b from-surface-900/0 to-surface-900 sticky bottom-0 left-0 right-0"></div>
	</div>
	<form class="flex flex-col gap-2 flex-shrink-0" use:focusTrap={true} onsubmit={onSubmit}>
		{#if !stateIsValid}
			<aside class="alert variant-ghost-error" transition:slide={{ axis: 'y' }}>
				<div class="alert-message">
					<p>
						Your input is invalid, the first message can only be a system prompt or a question and the last message must
						be a question or system prompt.
					</p>
				</div>
			</aside>
		{/if}
		<ModelError />
		<label class="label">
			<div class="flex justify-between items-center gap-2">
				<div class="flex items-center gap-2">
					{#if chat.state.options.model}
						<div class="flex items-center gap-2 text-xs opacity-75 text-right text-primary-500">
							<span class="badge variant-soft-secondary">Model</span>
							<div>{chat.state.options.model}</div>
						</div>
					{:else}
						<span></span>
					{/if}
					{#if chat.state.usage}
						<div class="flex items-center gap-2 text-xs opacity-75 text-right text-primary-500">
							<span class="badge variant-soft-secondary">Tokens</span>
							<div>
								Prompt: <span class="text-primary-400">{chat.state.usage.promptTokens}</span> / Completion:
								<span class="text-primary-400">{chat.state.usage.completionTokens}</span>
								/ Total: <span class="text-primary-400">{chat.state.usage.totalTokens}</span>
							</div>
							{#if chat.state.usage.tps}
								<div>
									<span class="text-primary-400">(</span>{chat.state.usage.tps}
									<span class="text-primary-400">tk/s</span><span class="text-primary-400">)</span>
								</div>
							{/if}
							<span></span>
						</div>
					{:else}
						<span></span>
					{/if}
					{#if chat.state.messages.length}
						<button type="button" class="btn text-xs py-1 px-2 variant-ghost-secondary" onclick={() => openShare()}>
							Share
						</button>
					{/if}
				</div>
				{#if tokens > 0}
					<span class="text-xs" transition:fade>
						~<span class="text-surface-300">{tokens}</span> tokens
					</span>
				{/if}
			</div>
			<div class="relative">
				<textarea
					bind:value={promptText}
					disabled={loading || !!models.error}
					class="textarea"
					rows="5"
					placeholder="Type something or drag and drop images..."
					data-focusindex="0"
				></textarea>
				{#if isDragging}
					<div
						class="absolute dropzone textarea flex flex-row gap-2 items-center border-2 border-dashed !border-primary-500 p-4 py-4 rounded-container-token top-0 left-0 right-0 bottom-0"
					>
						<div class="flex-grow-0 flex-shrink-0">
							<FileTextIcon class="mx-auto" size="32" />
						</div>
						<div class="flex flex-col gap-1 flex-grow flex-shrink">
							<div class="flex flex-col gap-1 flex-grow flex-shrink">
								<span class="label-text"><strong>Drop a file</strong></span>
							</div>
							<span>Images (.png, .jpeg, .jpg and .webp) allowed.</span>
						</div>
					</div>
				{/if}
			</div>
		</label>
		{#if files.length}
			<div class="flex flex-col gap-1">
				{#each files as file, index}
					<FileUploadPreview {file} {loading} remove={() => files.splice(index, 1)} />
				{/each}
			</div>
		{/if}
		<div class="flex flex-row justify-between">
			<button
				class="btn variant-ghost-surface"
				type="button"
				disabled={loading || !!models.error}
				onclick={(event) => {
					event.preventDefault();
					return (showOptions = !showOptions);
				}}
			>
				<Settings2Icon size={20} />
				<span>Options</span>
			</button>
			<div>
				<label for="fileUpload">
					<input
						id="fileUpload"
						class="hidden"
						type="file"
						multiple
						accept="image/png,image/jpeg,image/jpg,image/webp"
						disabled={loading || models.loading || !!models.error}
						onchange={onFileChange}
					/>
					<button
						type="button"
						class="btn variant-filled-secondary transition-all"
						disabled={loading || models.loading || !!models.error}
						onclick={() => document.getElementById('fileUpload')?.click()}
					>
						Upload image
					</button>
				</label>
			</div>
			<div class="flex flex-row gap-2">
				<button
					type="submit"
					class="btn variant-filled-primary transition-all"
					disabled={loading ||
						models.loading ||
						!!models.error ||
						(!promptText &&
							(chat.state.messages.length === 0 ||
								(chat.state.messages.length > 0 &&
									chat.state.messages[chat.state.messages.length - 1].role !== 'user')))}
				>
					Submit
				</button>
			</div>
		</div>
		{#if showOptions}
			<div class="flex flex-col gap-2" transition:slide={{ axis: 'y' }}>
				<div class="grid grid-cols-3 gap-2">
					<div class="flex items-center gap-1">
						<select bind:value={chat.state.options.model} class="select flex-grow-0" disabled={models.loading}>
							{#each Object.entries(files.length || chat.state.messages.some( (m) => m.versions.some( (v) => v.content.some((c) => c.type === 'image_url' || c.type === 'document_url') ) ) ? models.visionGroups : models.chatGroups) as [groupName, items]}
								<optgroup label={groupName}>
									{#each items as item}
										<option value={item.id}>{item.id}</option>
									{/each}
								</optgroup>
							{/each}
						</select>
						<a href="https://docs.mistral.ai/guides/model-selection/" target="_blank" rel="noreferrer noopener">
							<CircleHelpIcon />
						</a>
					</div>
					<label class="flex-shrink-0">
						<div class="flex flex-row justify-between items-center">
							<span>Temperature</span>
							<span class="text-surface-300">{chat.state.options.temperature}</span>
						</div>
						<input
							bind:value={chat.state.options.temperature}
							type="range"
							name="temperature"
							id="temperature"
							min="0"
							max="1"
							step="0.01"
							placeholder="Temperature"
						/>
					</label>
					<label class="flex-shrink-0">
						<div class="flex flex-row justify-between items-center">
							<span>Top P</span>
							<span class="text-surface-300">{chat.state.options.topP}</span>
						</div>
						<input
							bind:value={chat.state.options.topP}
							type="range"
							name="topP"
							id="topP"
							min="0"
							max="1"
							step="0.01"
							placeholder="Top P"
						/>
					</label>
				</div>
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-2 items-center">
					<div class="flex-shrink-0 cursor-pointer">
						<SlideToggle name="json" bind:checked={chat.state.options.json}>JSON</SlideToggle>
					</div>
					<input
						bind:value={chat.state.options.maxTokens}
						class="input"
						type="number"
						name="maxTokens"
						id="maxTokens"
						min="1"
						max={models.chat.find((model) => model.id === chat.state.options.model)?.maxContextLength ?? 32000}
						placeholder="Max tokens"
					/>
					<input
						bind:value={chat.state.options.randomSeed}
						class="input"
						type="number"
						name="randomSeed"
						id="randomSeed"
						placeholder="Seed"
					/>
					<div class="flex-shrink-0 cursor-pointer">
						<SlideToggle name="safePrompt" bind:checked={chat.state.options.safePrompt}>Safe prompt</SlideToggle>
					</div>
				</div>
				<div class="flex flex-col gap-2 col-span-2 lg:col-span-3">
					<label class="label">
						<div class="flex justify-between items-center">
							<span>System prompt</span>
							{#if systemPromptTokens > 0}
								<span class="text-xs" transition:fade>
									~<span class="text-surface-300">{systemPromptTokens}</span> tokens
								</span>
							{/if}
						</div>
						<textarea
							bind:value={systemPrompt}
							class="textarea"
							name="system"
							id="system"
							placeholder="System prompt"
							rows="5"
						></textarea>
					</label>
					<button
						type="button"
						class="btn variant-filled-primary transition-all ml-auto"
						disabled={loading || !systemPrompt}
						onclick={addSystemPrompt}
					>
						Add system prompt
					</button>
				</div>
			</div>
		{/if}
	</form>
</div>
