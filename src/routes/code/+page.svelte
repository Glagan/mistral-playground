<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { CodeBlock, focusTrap } from '@skeletonlabs/skeleton';
	import { apiKey } from '$lib/stores/apiKey';
	import type { Usage } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import { onDestroy, onMount } from 'svelte';
	import Settings2Icon from 'lucide-svelte/icons/settings-2';
	import CircleHelpIcon from 'lucide-svelte/icons/circle-help';
	import Trash2Icon from 'lucide-svelte/icons/trash-2';
	import { loadModels, models } from '$lib/stores/models.svelte';
	import { specificModelsTokenLimit } from '$lib/const';
	import { code } from '$lib/stores/code.svelte';
	import { getClientForRequest } from '$lib/mistral';
	import ModelError from '$lib/components/ModelError.svelte';

	if (browser && !$apiKey) {
		goto('/');
	}

	let showOptions = $state(false);

	let error = $state<{ text: string; body?: object } | null>(null);
	let response = $state<{ prompt: string; response: string } | null>(null);

	$effect(() => {
		code.state.id;
		error = null;
	});

	const unsubscribe = settings.subscribe((value) => {
		code.state.options.temperature = value.temperature;
		code.state.options.randomSeed = value.seed ? Number(value.seed) : undefined;
	});

	/* function removeFromHistory() {
		$history = $history.filter((e) => e.id !== code.state.id);
		$history = $history;
	}

	function updateOrInsertHistory() {
		$history = $history.filter((e) => e.id !== code.state.id);
		$history.splice(0, 0, {
			id: code.state.id,
			messages: JSON.parse(JSON.stringify(code.state.messages)),
			usage: JSON.parse(JSON.stringify(code.state.usage)),
			options: JSON.parse(JSON.stringify(code.state.options))
		});
		$history = $history;
	} */

	let loading = $state(false);
	let abortController: AbortController | null = null;

	async function generate() {
		const outputNode = document.getElementById('messages-container');
		loading = true;
		showOptions = false;

		abortController = new AbortController();
		const startedAt = performance.now();
		try {
			const client = getClientForRequest({ apiKey: $apiKey, endpoint: $settings.endpoint });
			const chatStreamResponse = client.completionStream(
				{
					model: code.state.options.model,
					// minTokens: code.state.options.minTokens,
					maxTokens: code.state.options.maxTokens,
					temperature: code.state.options.temperature,
					topP: code.state.options.topP,
					prompt: code.state.prompt,
					suffix: code.state.suffix,
					// Delete default empty stop token and replace "\n" with actual new line
					stop: code.state.stop.filter((s) => s).map((s) => s.replace(/\\r\\n?|\\n/g, '\n'))
				},
				{ signal: abortController.signal }
			);
			response = { prompt: $state.snapshot(code.state.prompt), response: '' };
			for await (const message of chatStreamResponse) {
				// console.log(message);
				if (message.choices[0].delta.content !== undefined) {
					const text = message.choices[0].delta.content;
					response.response += text ?? '';
				}
				if (message.usage) {
					const completionTime = performance.now() - startedAt;
					code.state.usage = message.usage;
					code.state.usage.tps = Math.round(
						Number((message.usage as Usage).completion_tokens / (completionTime / 1000))
					);
				}
				if (outputNode) {
					outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
				}
			}
		} catch (__error) {
			const _error = __error as Error;
			// Ignore abort errors
			if (_error.name !== 'AbortError') {
				const responseBody = _error.message.match(/([\s\S]+?)({[\s\S]+?})/is);
				if (responseBody) {
					try {
						const body = JSON.parse(responseBody[2].trim());
						error = {
							text: `Failed to generate: ${responseBody[1].trim()}`,
							body
						};
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
		event.preventDefault();
		error = null;
		response = null;
		await generate();
	}

	async function stopGenerating(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		loading = false;
		abortController?.abort();
	}

	const out = $derived(response ? `${response.prompt}${response.response}`.trim() : '');

	function deleteApiKey() {
		apiKey.set('');
		models.error = null;
		goto('/');
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
	{#if response}
		<div class="flex flex-col flex-grow flex-shrink gap-2 w-full overflow-auto">
			<div class="card overflow-x-hidden">
				<CodeBlock language="txt" code={out}></CodeBlock>
			</div>
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
		</div>
	{:else}
		<div class="flex justify-center items-center flex-grow flex-shrink w-full overflow-auto"></div>
	{/if}
	{#if error}
		<aside class="flex flex-col gap-2 items-start alert variant-ghost-error" transition:slide={{ axis: 'y' }}>
			<div class="alert-message space-y-4 rendered-markdown">
				{error.text}
			</div>
			{#if error.body}
				<CodeBlock language="json" code={JSON.stringify(error.body, undefined, 4)} class="!ml-0 w-full"></CodeBlock>
			{/if}
		</aside>
	{/if}
	<form class="flex flex-col gap-2 flex-shrink-0" use:focusTrap={true} onsubmit={onSubmit}>
		<ModelError />
		<div class="alert variant-ghost-tertiary" transition:slide={{ axis: 'y' }}>
			<div>
				<CircleHelpIcon size={24} />
			</div>
			<div class="alert-message">
				<p>
					Check the Mistral documentation to find how this works, you can find it <a
						href="https://docs.mistral.ai/capabilities/code_generation/"
						target="_blank"
						class="font-bold underline">here</a
					>.
				</p>
			</div>
		</div>
		<label class="label">
			<div class="flex justify-between items-center">
				{#if code.state.usage}
					<div class="flex items-center gap-2 text-xs opacity-75 text-right text-primary-500">
						<span class="badge variant-soft-secondary">Tokens</span>
						<div>
							Prompt: <span class="text-primary-400">{code.state.usage.prompt_tokens}</span> / Completion:
							<span class="text-primary-400">{code.state.usage.completion_tokens}</span>
							/ Total: <span class="text-primary-400">{code.state.usage.total_tokens}</span>
						</div>
						{#if code.state.usage.tps}
							<div>
								<span class="text-primary-400">(</span>{code.state.usage.tps}
								<span class="text-primary-400">tk/s</span><span class="text-primary-400">)</span>
							</div>
						{/if}
						<span></span>
					</div>
				{:else}
					<span></span>
				{/if}
			</div>
			<textarea
				bind:value={code.state.prompt}
				disabled={loading || !!models.error}
				class="textarea"
				rows="3"
				placeholder="Prompt"
				data-focusindex="0"
			></textarea>
			<p class="text-surface-400 text-sm">
				Code generation will be between <b>Prompt</b> and <b>Suffix</b> if there is one, or else it will generate after
				<b>Prompt</b>.
			</p>
			<textarea
				bind:value={code.state.suffix}
				disabled={loading || !!models.error}
				class="textarea"
				rows="1"
				placeholder="Suffix (optional)"
				data-focusindex="1"
			></textarea>
			<div class="flex flex-col gap-1">
				{#each code.state.stop as stopToken, index}
					<div class="flex flex-row">
						<div class="flex flex-row input-group input-group-divider grid-cols-[auto_1fr_auto]">
							<input
								bind:value={code.state.stop[index]}
								type="text"
								placeholder="Stop token"
								class="flex-grow flex-shrink"
							/>
							<button
								type="button"
								class="btn variant-filled-error flex-shrink-0"
								onclick={() => {
									if (code.state.stop.length === 1) {
										code.state.stop[0] = '';
									} else {
										code.state.stop.splice(index, 1);
									}
								}}
							>
								<Trash2Icon />
							</button>
						</div>
						{#if code.state.stop.length - 1 === index}
							<button
								type="button"
								class="btn variant-filled-secondary flex-shrink-0 ml-4"
								onclick={() => code.state.stop.push('')}
							>
								Add stop token
							</button>
						{/if}
					</div>
				{/each}
			</div>
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
				disabled={loading || models.loading || !!models.error || !code.state.prompt}
			>
				Submit
			</button>
		</div>
		{#if showOptions}
			<div class="flex flex-col gap-2" transition:slide={{ axis: 'y' }}>
				<div class="grid grid-cols-3 gap-2">
					<div class="flex items-center gap-1">
						<select bind:value={code.state.options.model} class="select flex-grow-0" disabled={models.loading}>
							{#each models.list.filter((model) => /codestral/.test(model.id)) as item}
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
							<span class="text-surface-300">{code.state.options.temperature}</span>
						</div>
						<input
							bind:value={code.state.options.temperature}
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
							<span class="text-surface-300">{code.state.options.topP}</span>
						</div>
						<input
							bind:value={code.state.options.topP}
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
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-2 items-center">
					<!-- <input
						bind:value={code.state.options.minTokens}
						class="input"
						type="number"
						name="minTokens"
						id="minTokens"
						min="1"
						max={specificModelsTokenLimit[code.state.options.model] ?? 32000}
						placeholder="Min tokens"
					/> -->
					<input
						bind:value={code.state.options.maxTokens}
						class="input"
						type="number"
						name="maxTokens"
						id="maxTokens"
						min="1"
						max={specificModelsTokenLimit[code.state.options.model] ?? 32000}
						placeholder="Max tokens"
					/>
					<input
						bind:value={code.state.options.randomSeed}
						class="input"
						type="number"
						name="randomSeed"
						id="randomSeed"
						placeholder="Seed"
					/>
				</div>
			</div>
		{/if}
	</form>
</div>
