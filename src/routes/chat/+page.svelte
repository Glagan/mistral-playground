<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { SlideToggle, focusTrap } from '@skeletonlabs/skeleton';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/stores/apiKey';
	import type { Answer, Options, Question, Usage } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { history } from '$lib/stores/history';
	import { v4 as uuidv4 } from 'uuid';
	import Messages from '$lib/components/Messages.svelte';
	import { settings } from '$lib/stores/settings';
	import { onDestroy } from 'svelte';
	import { current, resetCurrent } from '$lib/stores/current';

	if (browser && !$apiKey) {
		goto('/');
	}

	const encoding = get_encoding('cl100k_base');

	let showOptions = $state(false);
	let promptText = $state('');

	const unsubscribe = settings.subscribe((value) => {
		if ($current.messages.length === 0) {
			$current.options.temperature = value.temperature;
			$current.options.randomSeed = value.seed;
		}
	});

	const tokens = $derived(encoding.encode(promptText).length);
	const systemPromptTokens = $derived(encoding.encode($current.options.system).length);

	function updateOrInsertHistory() {
		$history = $history.filter((e) => e.id !== $current.id);
		$history.splice(0, 0, {
			id: $current.id,
			messages: JSON.parse(JSON.stringify($current.messages)),
			options: JSON.parse(JSON.stringify($current.options))
		});
		$history = $history;
	}

	let loading = $state(false);
	let keepGenerating = $state(true);
	let currentStream: ReadableStream | null = null;

	async function onSubmit(event: Event) {
		event.preventDefault();
		if (!promptText.length) {
			return;
		}

		loading = true;
		showOptions = false;
		keepGenerating = true;
		const previousHistory = JSON.parse(JSON.stringify($current.messages));
		if ($current.options.system) {
			$current.messages.push({ type: 'system', content: $current.options.system });
			$current.messages = $current.messages;
		}
		$current.messages.push({ type: 'question', content: promptText });
		$current.messages = $current.messages;
		const promptInput = promptText;
		promptText = '';

		const answer = $state<Question | Answer>({ type: 'answer', content: '', usage: undefined });
		$current.messages.push(answer);
		$current.messages = $current.messages;

		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				apiKey: $apiKey,
				prompt: promptInput,
				history: previousHistory,
				options: $current.options
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
			currentStream = response.body;
			const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
			while (reader && keepGenerating) {
				const { value, done } = await reader.read();
				if (done) break;
				if (/^#/.test(value)) {
					const usage = JSON.parse(value.slice(1)) as Usage;
					(answer as Answer).usage = usage;
				} else {
					answer.content += value ?? '';
				}
				// TODO scroll down messages container on new data
			}
			// Remove embedded usage that's stuck to the end if the string was received in a single event or was attached to another one
			const embeddedUsage = answer.content.match(/#({.+?})$/);
			if (embeddedUsage) {
				answer.content = answer.content.replace(/#({.+?})$/, '');
				(answer as Answer).usage = JSON.parse(embeddedUsage[1]) as Usage;
			}
			updateOrInsertHistory();
		} catch (error) {
			console.error(error);
			answer.type = 'error';
			answer.content = `Failed to generate: ${error}`;
		} finally {
			currentStream = null;
			loading = false;
			keepGenerating = false;
		}
	}

	async function stopGenerating(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		keepGenerating = false;
		if (currentStream && !currentStream.locked) {
			currentStream.cancel();
		}
	}

	function resetSession(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		resetCurrent();
		showOptions = false;
		promptText = '';
	}

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class="flex justify-center items-stretch flex-col gap-4 p-4 max-h-screen">
	{#if $current.messages.length}
		<Messages bind:messages={$current.messages} />
	{:else}
		<div class="flex justify-center items-center flex-grow flex-shrink w-full overflow-auto">
			<span class="text-sm text-surface-200 text-opacity-75 italic">Messages will appear here</span>
		</div>
	{/if}
	<form class="flex flex-col gap-2 flex-shrink-0" use:focusTrap={true} onsubmit={onSubmit}>
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
			{#if !$current.messages.length}
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
				<button
					class="btn variant-ghost-warning transition-all disabled:opacity-75"
					disabled={loading}
					type="button"
					transition:fade={{ duration: 200 }}
					onclick={resetSession}>New session</button
				>
			{/if}
			{#if loading && keepGenerating}
				<button
					class="btn variant-ghost-error transition-all disabled:opacity-75"
					type="button"
					transition:fade={{ duration: 200 }}
					onclick={stopGenerating}
				>
					Stop
				</button>
			{/if}
			<button
				type="submit"
				class="btn variant-filled-primary transition-all disabled:opacity-75"
				disabled={loading}>Submit</button
			>
		</div>
		{#if showOptions}
			<div class="flex flex-col gap-2" transition:slide={{ axis: 'y' }}>
				<div class="flex flex-row justify-between gap-2 items-center *:max-w-[30%]">
					<select bind:value={$current.options.model} class="select flex-grow-0">
						<option value="mistral-tiny">Mistral Tiny</option>
						<option value="mistral-small">Mistral Small</option>
						<option value="mistral-medium">Mistral Medium</option>
					</select>
					<label class="flex-shrink-0">
						<div class="flex flex-row justify-between items-center">
							<span>Temperature</span>
							<span class="text-surface-300">{$current.options.temperature}</span>
						</div>
						<input
							bind:value={$current.options.temperature}
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
							<span class="text-surface-300">{$current.options.topP}</span>
						</div>
						<input
							bind:value={$current.options.topP}
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
				<div class="flex flex-row justify-between gap-2 items-center *:max-w-[30%]">
					<input
						bind:value={$current.options.maxTokens}
						class="input"
						type="number"
						name="maxTokens"
						id="maxTokens"
						min="1"
						max="32000"
						placeholder="Max tokens"
					/>
					<input
						bind:value={$current.options.randomSeed}
						class="input"
						type="number"
						name="randomSeed"
						id="randomSeed"
						placeholder="Seed"
					/>
					<div class="flex-shrink-0 cursor-pointer">
						<SlideToggle name="safePrompt" bind:checked={$current.options.safePrompt}>
							Safe prompt
						</SlideToggle>
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
						bind:value={$current.options.system}
						class="textarea"
						name="system"
						id="system"
						placeholder="System prompt"
						rows="4"
					></textarea>
				</label>
			</div>
		{/if}
	</form>
</div>
