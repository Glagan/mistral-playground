<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { SlideToggle, focusTrap } from '@skeletonlabs/skeleton';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/stores/apiKey';
	import type { Message, Usage } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { history } from '$lib/stores/history';
	import Messages from '$lib/components/Messages.svelte';
	import { settings } from '$lib/stores/settings';
	import { onDestroy, onMount } from 'svelte';
	import { current } from '$lib/stores/current.svelte';
	import { v4 as uuid } from 'uuid';
	import Settings2Icon from 'lucide-svelte/icons/settings-2';
	import CircleHelpIcon from 'lucide-svelte/icons/circle-help';
	import TriangleAlertIcon from 'lucide-svelte/icons/triangle-alert';
	import { loadModels, models } from '$lib/stores/models.svelte';
	import { specificModelsTokenLimit } from '$lib/const';

	if (browser && !$apiKey) {
		goto('/');
	}

	const encoding = get_encoding('cl100k_base');

	let showOptions = $state(false);
	let promptText = $state('');

	let error = $state('');

	$effect(() => {
		current.state.id;
		error = '';
	});

	const unsubscribe = settings.subscribe((value) => {
		if (current.state.messages.length === 0) {
			current.state.options.temperature = value.temperature;
			current.state.options.randomSeed = value.seed ? Number(value.seed) : undefined;
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
		tokens <= (specificModelsTokenLimit[current.state.options.model] ?? 32000) &&
			messageOrderIsValid(current.state.messages)
	);

	function removeFromHistory() {
		$history = $history.filter((e) => e.id !== current.state.id);
		$history = $history;
	}

	function updateOrInsertHistory() {
		$history = $history.filter((e) => e.id !== current.state.id);
		$history.splice(0, 0, {
			id: current.state.id,
			messages: JSON.parse(JSON.stringify(current.state.messages)),
			usage: JSON.parse(JSON.stringify(current.state.usage)),
			options: JSON.parse(JSON.stringify(current.state.options))
		});
		$history = $history;
	}

	let loading = $state(false);
	let keepGenerating = $state(true);
	let currentStream: ReadableStream | null = null;

	async function generate(messages: Message[], answer: Message) {
		const outputNode = document.getElementById('messages-container');
		loading = true;
		showOptions = false;
		keepGenerating = true;

		let response: Response;
		try {
			response = await fetch('/api/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apiKey: $apiKey,
					messages: messages.map((message) => ({
						type: message.type,
						content: message.content[message.index]
					})),
					options: current.state.options,
					endpoint: $settings.endpoint
				})
			});
		} catch (_error) {
			console.error(_error);
			if (answer.content.length === 1) {
				current.state.messages.pop();
			} else {
				answer.content.splice(answer.index, 1);
				answer.index -= 1;
			}
			error = `Failed to send request: ${_error}`;
			return;
		}

		if (!response.ok) {
			const rawBody = await response.text();
			if (answer.content.length === 1) {
				current.state.messages.pop();
			} else {
				answer.content.splice(answer.index, 1);
				answer.index -= 1;
			}
			try {
				const body = JSON.parse(rawBody) as {
					error: any;
					message?: string;
					code: 'ERR_PARSING' | 'ERR_API_KEY' | 'ERR_API_REQ';
				};
				if (body.code === 'ERR_PARSING') {
					error = `Failed to send request:\n${body.error.issues.map((issue: { message: string; path: string[] }) => `- ${issue.path.join('.')}: ${issue.message}`).join('\n')}`;
				} else if (body.code === 'ERR_API_KEY') {
					error = 'Your API key is invalid.';
				} else if (body.code === 'ERR_API_REQ') {
					if (body.message) {
						try {
							const asJson = JSON.parse(body.message);
							error = `Request failed:\n\`\`\`json\n${JSON.stringify(asJson, undefined, 4)}\n\`\`\``;
						} catch (_error) {
							error = `Failed to generate output:\n${body.message}`;
						}
					} else {
						error = 'Your request is invalid.';
					}
				}
			} catch (_error) {
				error = `Failed to send request: ${response.status} ${response.statusText}`;
			} finally {
				currentStream = null;
				loading = false;
				keepGenerating = false;
			}
			updateOrInsertHistory();
			return;
		}

		try {
			// Read each chunk and update the last response reference
			currentStream = response.body;
			const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
			while (reader && keepGenerating) {
				const { value, done } = await reader.read();
				if (done) break;
				if (/^#/.test(value)) {
					const usage = JSON.parse(value.slice(1)) as Usage;
					current.state.usage = usage;
				} else {
					answer.content[answer.index] += value ?? '';
				}
				if (outputNode) {
					outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
				}
			}
			// Remove embedded usage that's stuck to the end if the string was received in a single event or was attached to another one
			const embeddedUsage = answer.content[answer.index].match(/#({.+?})$/);
			if (embeddedUsage) {
				answer.content[answer.index] = answer.content[answer.index].replace(/#({.+?})$/, '');
				current.state.usage = JSON.parse(embeddedUsage[1]) as Usage;
			}
			if (current.state.options.json) {
				answer.content[answer.index] =
					`\`\`\`json\n${JSON.stringify(JSON.parse(answer.content[answer.index]), undefined, 4)}\n\`\`\``;
			}
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
			updateOrInsertHistory();
		} catch (error) {
			console.error(error);
			if (answer.content.length === 1) {
				current.state.messages.pop();
			} else {
				answer.content.splice(answer.index, 1);
				answer.index -= 1;
			}
			error = `Failed to generate: ${error}`;
		} finally {
			currentStream = null;
			loading = false;
			keepGenerating = false;
		}
	}

	async function onSubmit(event: Event) {
		const outputNode = document.getElementById('messages-container');
		event.preventDefault();
		error = '';
		if (systemPrompt) {
			current.state.messages.push({
				id: uuid(),
				type: 'system',
				index: 0,
				content: [systemPrompt]
			});
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
		}
		if (promptText.length) {
			current.state.messages.push({
				id: uuid(),
				type: 'user',
				index: 0,
				content: [promptText]
			});
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
		}
		promptText = '';

		// Take the messages up to here for the next generation
		const messagesToSend = JSON.parse(JSON.stringify(current.state.messages));

		const answer: Message = $state({
			id: uuid(),
			type: 'assistant',
			index: 0,
			content: ['']
		});
		current.state.messages.push(answer);
		if (outputNode) {
			outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
		}

		await generate(messagesToSend, answer);
	}

	async function addSystemPrompt(event: Event) {
		event.preventDefault();
		if (systemPrompt) {
			current.state.messages.push({
				id: uuid(),
				type: 'system',
				index: 0,
				content: [systemPrompt]
			});
			systemPrompt = '';
			showOptions = false;
		}
	}

	async function stopGenerating(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		loading = false;
		keepGenerating = false;
		if (currentStream && !currentStream.locked) {
			currentStream.cancel();
			currentStream = null;
		}
	}

	// * > Message events

	function moveUp(message: Message) {
		error = '';
		const index = current.state.messages.findIndex((m) => m.id === message.id);
		if (index > 0) {
			current.state.messages.splice(index, 1);
			current.state.messages.splice(index - 1, 0, message);
			updateOrInsertHistory();
		}
	}

	function moveDown(message: Message) {
		error = '';
		const index = current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0 && index < current.state.messages.length - 1) {
			current.state.messages.splice(index, 1);
			current.state.messages.splice(index + 1, 0, message);
			updateOrInsertHistory();
		}
	}

	async function refresh(message: Message) {
		error = '';
		const index = current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			const message = current.state.messages[index];
			message.content.push('');
			message.index = message.content.length - 1;

			// Take the messages up to the answer we need to re-generate
			const messagesToSend = JSON.parse(JSON.stringify(current.state.messages.slice(0, index)));

			await generate(messagesToSend, message);
		}
	}

	async function previousVersion(message: Message) {
		error = '';
		const index = current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			if (current.state.messages[index].index > 0) {
				current.state.messages[index].index = current.state.messages[index].index - 1;
				updateOrInsertHistory();
			}
		}
	}

	async function nextVersion(message: Message) {
		error = '';
		const index = current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			if (current.state.messages[index].index < current.state.messages[index].content.length - 1) {
				current.state.messages[index].index = current.state.messages[index].index + 1;
				updateOrInsertHistory();
			}
		}
	}

	async function deleteVersion(message: Message) {
		error = '';
		const index = current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			current.state.messages[index].content.splice(current.state.messages[index].index);
			if (current.state.messages[index].index >= current.state.messages[index].content.length - 1) {
				current.state.messages[index].index -= 1;
			}
			updateOrInsertHistory();
		}
	}

	function updateMessage(message: Message, content: string) {
		error = '';
		const index = current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			current.state.messages[index].content[message.index] = content;
			updateOrInsertHistory();
		}
	}

	function deleteMessage(message: Message) {
		error = '';
		const index = current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			current.state.messages.splice(index, 1);
			if (current.state.messages.length === 0) {
				removeFromHistory();
			} else {
				updateOrInsertHistory();
			}
		}
	}

	// * < Message events

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
	{#if current.state.messages.length}
		<Messages
			messages={current.state.messages}
			interactive
			{loading}
			{error}
			{moveUp}
			{moveDown}
			{refresh}
			{previousVersion}
			{nextVersion}
			{deleteVersion}
			{updateMessage}
			{deleteMessage}
			generate={onSubmit}
		/>
		{#if loading && keepGenerating}
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
		{#if models.error}
			<div class="alert variant-ghost-error" transition:slide={{ axis: 'y' }}>
				<div>
					<TriangleAlertIcon size={24} />
				</div>
				<div class="alert-message">
					<h3 class="text-xl">{models.error.title}</h3>
					<p>{models.error.message}</p>
				</div>
			</div>
		{/if}
		<label class="label">
			<div class="flex justify-between items-center">
				{#if current.state.usage}
					<div class="flex items-center gap-2 text-xs opacity-75 text-right text-primary-500">
						<span class="badge variant-soft-secondary">Tokens</span>
						<div>
							Prompt: <span class="text-primary-400">{current.state.usage.prompt_tokens}</span> / Completion:
							<span class="text-primary-400">{current.state.usage.completion_tokens}</span>
							/ Total: <span class="text-primary-400">{current.state.usage.total_tokens}</span>
						</div>
						{#if current.state.usage.tps}
							<div>
								<span class="text-primary-400">(</span>{current.state.usage.tps}
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
			<button
				type="submit"
				class="btn variant-filled-primary transition-all"
				disabled={loading ||
					models.loading ||
					!!models.error ||
					(!promptText && current.state.messages[current.state.messages.length - 1]?.type !== 'user')}
			>
				Submit
			</button>
		</div>
		{#if showOptions}
			<div class="flex flex-col gap-2" transition:slide={{ axis: 'y' }}>
				<div class="grid grid-cols-3 gap-2">
					<div class="flex items-center gap-1">
						<select bind:value={current.state.options.model} class="select flex-grow-0" disabled={models.loading}>
							{#each models.list as item}
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
							<span class="text-surface-300">{current.state.options.temperature}</span>
						</div>
						<input
							bind:value={current.state.options.temperature}
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
							<span class="text-surface-300">{current.state.options.topP}</span>
						</div>
						<input
							bind:value={current.state.options.topP}
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
						<SlideToggle name="json" bind:checked={current.state.options.json}>JSON</SlideToggle>
					</div>
					<input
						bind:value={current.state.options.maxTokens}
						class="input"
						type="number"
						name="maxTokens"
						id="maxTokens"
						min="1"
						max={specificModelsTokenLimit[current.state.options.model] ?? 32000}
						placeholder="Max tokens"
					/>
					<input
						bind:value={current.state.options.randomSeed}
						class="input"
						type="number"
						name="randomSeed"
						id="randomSeed"
						placeholder="Seed"
					/>
					<div class="flex-shrink-0 cursor-pointer">
						<SlideToggle name="safePrompt" bind:checked={current.state.options.safePrompt}>Safe prompt</SlideToggle>
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
