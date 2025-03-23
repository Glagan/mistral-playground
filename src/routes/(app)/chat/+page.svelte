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
	import type { Message, Usage } from '$lib/types';
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
	import { loadModels, models } from '$lib/stores/models.svelte';
	import { specificModelsTokenLimit } from '$lib/const';
	import { getClientForRequest } from '$lib/mistral';
	import ModelError from '$lib/components/ModelError.svelte';
	import ShareModal from '$lib/components/ShareModal.svelte';

	if (browser && !$apiKey) {
		goto('/', { replaceState: true });
	}

	const encoding = get_encoding('cl100k_base');
	const modalStore = getModalStore();

	let showOptions = $state(false);
	let promptText = $state('');

	let error: { text: string; body?: object } | null = $state(null);

	$effect(() => {
		chat.state.id;
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
				return message.type === 'user' || message.type === 'system';
			}
			return true;
		});
	}

	const tokens = $derived(encoding.encode(promptText).length);
	let systemPrompt = $state('');
	const systemPromptTokens = $derived(encoding.encode(systemPrompt).length);
	const stateIsValid = $derived(
		tokens <= (specificModelsTokenLimit[chat.state.options.model] ?? 32000) && messageOrderIsValid(chat.state.messages)
	);

	function removeFromHistory() {
		$history.chat = $history.chat.filter((e) => e.id !== chat.state.id);
		$history.chat = $history.chat;
	}

	function updateOrInsertHistory() {
		$history.chat = $history.chat.filter((e) => e.id !== chat.state.id);
		$history.chat.splice(0, 0, {
			id: chat.state.id,
			messages: JSON.parse(JSON.stringify(chat.state.messages)),
			usage: JSON.parse(JSON.stringify(chat.state.usage)),
			options: JSON.parse(JSON.stringify(chat.state.options))
		});
		$history.chat = $history.chat;
	}

	let loading = $state(false);
	let abortController: AbortController | null = null;

	async function generate(messages: Message[], answer: Message) {
		const outputNode = document.getElementById('messages-container');
		loading = true;
		showOptions = false;

		abortController = new AbortController();
		const startedAt = performance.now();
		try {
			const client = getClientForRequest({ apiKey: $apiKey, endpoint: $settings.endpoint });
			const chatStreamResponse = await client.chat.stream(
				{
					model: chat.state.options.model ? chat.state.options.model : 'open-mixtral-8x22b',
					messages: messages.map((message) => ({ role: message.type, content: message.content[message.index] })),
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
				// console.log(message);
				const data = message.data;
				if (data.choices[0].delta.content !== undefined) {
					const text = data.choices[0].delta.content;
					answer.content[answer.index] += text ?? '';
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
			if (chat.state.options.json) {
				answer.content[answer.index] =
					`\`\`\`json\n${JSON.stringify(JSON.parse(answer.content[answer.index]), undefined, 4)}\n\`\`\``;
			}
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
			updateOrInsertHistory();
		} catch (__error) {
			const _error = __error as Error;
			// Ignore abort errors
			if (_error.name !== 'AbortError') {
				if (answer.content.length === 1) {
					chat.state.messages.pop();
				} else {
					answer.content.splice(answer.index, 1);
					answer.index -= 1;
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
		}
	}

	async function onSubmit(event: Event) {
		const outputNode = document.getElementById('messages-container');
		event.preventDefault();
		error = null;
		if (systemPrompt) {
			chat.state.messages.push({ id: uuid(), type: 'system', index: 0, content: [systemPrompt] });
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
		}
		if (promptText.length) {
			chat.state.messages.push({ id: uuid(), type: 'user', index: 0, content: [promptText] });
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
		}
		promptText = '';

		// Take the messages up to here for the next generation
		const messagesToSend = JSON.parse(JSON.stringify(chat.state.messages));

		const answer: Message = $state({ id: uuid(), type: 'assistant', index: 0, content: [''] });
		chat.state.messages.push(answer);
		if (outputNode) {
			outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
		}

		await generate(messagesToSend, answer);
	}

	async function addSystemPrompt(event: Event) {
		event.preventDefault();
		if (systemPrompt) {
			chat.state.messages.push({ id: uuid(), type: 'system', index: 0, content: [systemPrompt] });
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
			const message = chat.state.messages[index];
			message.content.push('');
			message.index = message.content.length - 1;

			// Take the messages up to the answer we need to re-generate
			const messagesToSend = JSON.parse(JSON.stringify(chat.state.messages.slice(0, index)));

			await generate(messagesToSend, message);
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
			if (chat.state.messages[index].index < chat.state.messages[index].content.length - 1) {
				chat.state.messages[index].index = chat.state.messages[index].index + 1;
				updateOrInsertHistory();
			}
		}
	}

	async function deleteVersion(message: Message) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			chat.state.messages[index].content.splice(chat.state.messages[index].index);
			if (chat.state.messages[index].index >= chat.state.messages[index].content.length - 1) {
				chat.state.messages[index].index -= 1;
			}
			updateOrInsertHistory();
		}
	}

	function updateMessage(message: Message, content: string) {
		error = null;
		const index = chat.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			chat.state.messages[index].content[message.index] = content;
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

	onMount(() => {
		loadModels();
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div
	class="flex flex-grow flex-shrink justify-center items-stretch flex-col gap-4 p-4 max-h-[calc(100vh-88px)] lg:max-h-screen"
>
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
				class="btn variant-ghost-error transition-all mx-auto"
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
			<div class="flex justify-between items-center">
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
				{#if tokens > 0}
					<span class="text-xs" transition:fade>
						~<span class="text-surface-300">{tokens}</span> tokens
					</span>
				{/if}
			</div>
			<textarea
				bind:value={promptText}
				disabled={loading || !!models.error}
				class="textarea"
				rows="3"
				placeholder="Type something..."
				data-focusindex="0"
			></textarea>
		</label>
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
			<div class="flex flex-row gap-2">
				{#if chat.state.messages.length}
					<button type="button" class="btn variant-ghost-secondary mx-auto" onclick={() => openShare()}>Share</button>
				{/if}
				<button
					type="submit"
					class="btn variant-filled-primary transition-all"
					disabled={loading ||
						models.loading ||
						!!models.error ||
						(!promptText && chat.state.messages[chat.state.messages.length - 1]?.type !== 'user')}
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
							{#each models.chat as item}
								<option value={item.id}>{item.id}</option>
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
						max={specificModelsTokenLimit[chat.state.options.model] ?? 32000}
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
							rows="4"
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
