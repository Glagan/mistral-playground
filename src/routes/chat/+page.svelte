<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { SlideToggle, focusTrap } from '@skeletonlabs/skeleton';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/apiKey';
	import type { Answer, Options, Question, Usage } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { history } from '$lib/history';
	import { v4 as uuidv4 } from 'uuid';
	import Messages from '$lib/components/Messages.svelte';

	if (browser && !$apiKey) {
		goto('/');
	}

	const encoding = get_encoding('cl100k_base');

	let id = $state(uuidv4());
	let messages = $state<(Question | Answer)[]>([]);
	let showOptions = $state(false);
	let promptText = $state('');

	function defaultOptions(): Options {
		return {
			model: 'mistral-small',
			temperature: 0.7,
			topP: 1,
			maxTokens: undefined,
			safePrompt: false,
			randomSeed: undefined,
			system: ''
		};
	}
	let options = $state<Options>(defaultOptions());

	const tokens = $derived(encoding.encode(promptText).length);
	const systemPromptTokens = $derived(encoding.encode(options.system).length);

	function updateOrInsertHistory() {
		$history = $history.filter((e) => e.id !== id);
		$history.unshift({
			id,
			messages: JSON.parse(JSON.stringify(messages)),
			options: JSON.parse(JSON.stringify(options))
		});
	}

	async function onSubmit(event: Event) {
		event.preventDefault();
		showOptions = false;
		const previousHistory = JSON.parse(JSON.stringify(messages));
		if (options.system) {
			messages.push({ type: 'system', content: options.system });
		}
		messages.push({ type: 'question', content: promptText });
		const promptInput = promptText;
		promptText = '';

		const answer = $state<Question | Answer>({ type: 'answer', content: '', usage: undefined });
		messages.push(answer);

		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				apiKey: $apiKey,
				prompt: promptInput,
				history: previousHistory,
				options
			})
		});
		try {
			if (!response.ok) {
				const rawBody = await response.text();
				answer.type = 'error';
				try {
					const body = JSON.parse(rawBody) as { error: any; code: 'ERR_PARSING' | 'ERR_API_KEY' };
					if (body.code === 'ERR_PARSING') {
						answer.content = `Failed to send request:\n${body.error.issues.map((issue: { message: string }) => issue.message).join('\n')}`;
					} else if (body.code === 'ERR_API_KEY') {
						answer.content = 'Your API Key is invalid.';
					}
				} catch (error) {
					answer.content = `Failed to send request: ${response.status} ${response.statusText}`;
				}
				updateOrInsertHistory();
				return;
			}
			// Read each chunk and update the last response reference
			const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
			while (reader && true) {
				const { value, done } = await reader.read();
				if (done) break;
				if (/^#/.test(value)) {
					const usage = JSON.parse(value.slice(1)) as Usage;
					(answer as Answer).usage = usage;
				} else {
					answer.content += value ?? '';
				}
			}
			updateOrInsertHistory();
		} catch (error) {
			console.error(error);
		}
	}

	function resetSession() {
		id = uuidv4();
		messages = [];
		showOptions = false;
		promptText = '';
		options = defaultOptions();
	}
</script>

<div class="flex justify-center items-stretch flex-col gap-4 p-4">
	<Messages {messages} />
	<form
		class="flex flex-col gap-2 flex-grow flex-shrink-0"
		use:focusTrap={true}
		onsubmit={onSubmit}
	>
		<label class="label">
			<div class="flex justify-between items-center">
				<span>Prompt</span>
				{#if tokens > 0}
					<span class="text-xs" transition:fade>
						~<span class="text-surface-300">{tokens}</span> tokens
					</span>
				{/if}
			</div>
			<textarea
				bind:value={promptText}
				class="textarea"
				rows="4"
				placeholder="Type something..."
				data-focusindex="0"
			/>
		</label>
		<div class="flex flex-row justify-between">
			{#if !messages.length}
				<button
					class="btn variant-ghost-surface"
					type="button"
					onclick={(event) => {
						event.preventDefault();
						return (showOptions = !showOptions);
					}}
				>
					Options
				</button>
			{:else}
				<button class="btn variant-ghost-warning" onclick={resetSession}>Reset session</button>
			{/if}
			<button type="submit" class="btn variant-filled-primary">Submit</button>
		</div>
		{#if showOptions}
			<div class="flex flex-col gap-2" transition:slide={{ axis: 'y' }}>
				<div class="flex flex-row justify-between gap-2 items-center">
					<select bind:value={options.model} class="select flex-grow-0">
						<option value="mistral-tiny">Mistral Tiny</option>
						<option value="mistral-small">Mistral Small</option>
						<option value="mistral-medium">Mistral Medium</option>
					</select>
					<label class="flex-shrink-0">
						<div class="flex flex-row justify-between items-center">
							<span>Temperature</span>
							<span class="text-surface-300">{options.temperature}</span>
						</div>
						<input
							bind:value={options.temperature}
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
							<span class="text-surface-300">{options.topP}</span>
						</div>
						<input
							bind:value={options.topP}
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
				<div class="flex flex-row justify-between gap-2 items-center">
					<input
						bind:value={options.maxTokens}
						class="input"
						type="number"
						name="maxTokens"
						id="maxTokens"
						min="1"
						max="16000"
						placeholder="Max tokens"
					/>
					<input
						bind:value={options.randomSeed}
						class="input"
						type="number"
						name="randomSeed"
						id="randomSeed"
						placeholder="Seed"
					/>
					<div class="flex-shrink-0 cursor-pointer">
						<SlideToggle name="safePrompt" bind:checked={options.safePrompt}
							>Safe prompt</SlideToggle
						>
					</div>
				</div>
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
						bind:value={options.system}
						class="textarea"
						name="system"
						id="system"
						placeholder="System prompt"
					></textarea>
				</label>
			</div>
		{/if}
	</form>
</div>
