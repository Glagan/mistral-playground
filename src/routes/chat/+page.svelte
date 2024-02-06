<script lang="ts">
	import { fade, scale, slide } from 'svelte/transition';
	import { SlideToggle, focusTrap } from '@skeletonlabs/skeleton';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/apiKey';
	import type { Answer, Options, Question, Usage } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	if (browser && !$apiKey) {
		goto('/');
	}

	const encoding = get_encoding('cl100k_base');

	let session = $state<(Question | Answer)[]>([
		// {
		// 	type: 'question',
		// 	content:
		// 		'Nulla nulla anim minim consequat laboris enim tempor eiusmod duis ad. Laboris dolor officia nostrud magna consequat sunt aliqua ex ea fugiat et nulla. Non qui exercitation ex sit duis anim in non amet qui nisi dolor aliqua sunt. Ut Lorem sint amet sit est cupidatat nostrud Lorem. Ex amet elit ullamco incididunt deserunt laborum fugiat aliqua. Minim ad in deserunt ea consectetur laborum pariatur elit fugiat aliquip nisi officia in et. Cupidatat adipisicing culpa ad nostrud officia veniam incididunt eiusmod aliqua officia ex aute.'
		// },
		// {
		// 	type: 'answer',
		// 	content:
		// 		'Nulla nulla anim minim consequat laboris enim tempor eiusmod duis ad. Laboris dolor officia nostrud magna consequat sunt aliqua ex ea fugiat et nulla. Non qui exercitation ex sit duis anim in non amet qui nisi dolor aliqua sunt. Ut Lorem sint amet sit est cupidatat nostrud Lorem. Ex amet elit ullamco incididunt deserunt laborum fugiat aliqua. Minim ad in deserunt ea consectetur laborum pariatur elit fugiat aliquip nisi officia in et. Cupidatat adipisicing culpa ad nostrud officia veniam incididunt eiusmod aliqua officia ex aute.'
		// }
	]);
	let showOptions = $state(false);
	let promptText = $state('');

	const options = $state<Options>({
		model: 'mistral-small',
		temperature: 0.7,
		topP: 1,
		maxTokens: undefined,
		safePrompt: false,
		randomSeed: undefined,
		system: ''
	});

	const tokens = $derived(encoding.encode(promptText).length);
	const systemPromptTokens = $derived(encoding.encode(options.system).length);

	async function onSubmit(event: Event) {
		event.preventDefault();
		showOptions = false;
		const previousHistory = JSON.parse(JSON.stringify(session));
		if (options.system) {
			session.push({ type: 'system', content: options.system });
		}
		session.push({ type: 'question', content: promptText });
		const promptInput = promptText;
		promptText = '';

		const answer = $state<Question | Answer>({ type: 'answer', content: '', usage: undefined });
		session.push(answer);

		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				apiKey: $apiKey,
				prompt: promptInput,
				history: previousHistory,
				options
			})
		});
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
			return;
		}
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
	}

	function resetSession() {
		session = [];
		showOptions = false;
		promptText = '';
	}
</script>

<div class="flex justify-center items-stretch flex-col gap-4 p-4">
	<div
		class="flex flex-col gap-4 flex-shrink w-full"
		class:flex-grow={session.length === 0}
		transition:scale
	>
		{#if session.length > 0}
			{#each session as block}
				{#if block.type === 'answer'}
					<div class="max-w-[66%] ml-auto">
						<p class="text-xs opacity-75 text-right text-primary-500">Answer</p>
						<div class="card p-4 variant-ghost-primary whitespace-pre-wrap" transition:scale>
							{block.content}
						</div>
						{#if block.usage}
							<p class="text-xs opacity-75 text-right text-primary-500">
								Prompt: <span class="text-primary-400">{block.usage.prompt_tokens}</span> /
								Completion: <span class="text-primary-400">{block.usage.completion_tokens}</span> /
								Total: <span class="text-primary-400">{block.usage.total_tokens}</span>
							</p>
						{/if}
					</div>
				{:else if block.type === 'question'}
					<div class="max-w-[66%]">
						<p class="text-xs opacity-75 text-surface-300">Question</p>
						<div class="card p-4 variant-ghost-surface whitespace-pre-wrap" transition:scale>
							{block.content}
						</div>
					</div>
				{:else if block.type === 'error'}
					<div class="max-w-[66%] ml-auto">
						<p class="text-xs opacity-75 text-error-300">Error</p>
						<div class="card p-4 variant-ghost-error whitespace-pre-wrap" transition:scale>
							{block.content}
						</div>
					</div>
				{:else}
					<div class="w-full">
						<p class="text-xs opacity-75 text-surface-300">System</p>
						<div class="card p-4 variant-ghost-secondary whitespace-pre-wrap" transition:scale>
							{block.content}
						</div>
					</div>
				{/if}
			{/each}
		{/if}
	</div>
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
			{#if !session.length}
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

<style lang="postcss">
</style>
