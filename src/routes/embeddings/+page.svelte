<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { focusTrap } from '@skeletonlabs/skeleton';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/stores/apiKey';
	import type { Usage } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import { Settings2Icon } from 'lucide-svelte';

	if (browser && !$apiKey) {
		goto('/');
	}

	const encoding = get_encoding('cl100k_base');

	let showOptions = $state(false);
	let model = $state('mistral-embed');
	let promptText = $state('');

	const tokens = $derived(encoding.encode(promptText).length);

	let loading = $state(false);
	let keepGenerating = $state(false);
	let error = $state('');

	let embeddings = $state<number[]>([]);

	async function onSubmit(event: Event) {
		event.preventDefault();

		loading = true;
		showOptions = false;
		keepGenerating = true;
		embeddings = [];
		error = '';

		let response: Response;
		try {
			response = await fetch('/api/embeddings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apiKey: $apiKey,
					input: [promptText],
					options: { model },
					endpoint: $settings.endpoint
				})
			});
		} catch (_error) {
			console.error(_error);
			error = `Failed to send request: ${error}`;
			return;
		}
		const rawBody = await response.text();

		if (response.ok) {
			const body = JSON.parse(rawBody) as {
				id: string;
				object: 'list';
				data: { object: 'embedding'; embedding: number[]; index: number }[];
				model: string;
				usage: Usage;
			};
			embeddings = body.data[0].embedding;
		} else {
			try {
				const body = JSON.parse(rawBody) as {
					error: any;
					message?: string;
				};
				error = body.message ?? body.error;
			} catch (error) {
				error = `Failed to send request: ${response.status} ${response.statusText}`;
			}
		}

		loading = false;
		keepGenerating = false;
	}

	async function stopGenerating(event: Event) {
		event.preventDefault();
		event.stopPropagation();

		loading = false;
		keepGenerating = false;
	}
</script>

<div
	class="flex flex-grow flex-shrink justify-center items-stretch flex-col gap-4 p-4 max-h-[calc(100vh-88px)] lg:max-h-screen"
>
	<div class="flex flex-col flex-grow flex-shrink gap-4 w-full overflow-auto">
		{#if error}
			<aside class="alert variant-ghost-error" transition:slide={{ axis: 'y' }}>
				<div class="alert-message">
					<p>{error}</p>
				</div>
			</aside>
		{/if}
		{#if embeddings.length > 0}
			<div class="card p-4 variant-ghost-primary overflow-x-hidden">
				{embeddings.join(', ')}
			</div>
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
		{:else if loading}
			<div class="card p-4 variant-ghost-secondary overflow-x-hidden">
				<span class="text-surface-200 italic">Loading...</span>
			</div>
		{/if}
	</div>
	<form class="flex flex-col gap-2 flex-shrink-0" use:focusTrap={true} onsubmit={onSubmit}>
		<label class="label">
			<div class="flex justify-end items-center">
				{#if tokens > 0}
					<span class="text-xs" transition:fade>
						~<span class="text-surface-300">{tokens}</span> tokens
					</span>
				{/if}
			</div>
			<textarea
				bind:value={promptText}
				disabled={loading}
				class="textarea"
				rows="3"
				placeholder="Type something..."
				data-focusindex="0"
			/>
		</label>
		<div class="flex flex-row justify-between">
			<button
				class="btn variant-ghost-surface"
				type="button"
				disabled={loading}
				onclick={(event) => {
					event.preventDefault();
					return (showOptions = !showOptions);
				}}
			>
				<Settings2Icon size={20} />
				<span>Options</span>
			</button>
			<button type="submit" class="btn variant-filled-primary transition-all" disabled={loading || !promptText}>
				Submit
			</button>
		</div>
		{#if showOptions}
			<div class="grid grid-cols-2 lg:grid-cols-3 gap-2 items-center" transition:slide={{ axis: 'y' }}>
				<select bind:value={model} class="select flex-grow-0">
					<option value="mistral-embed">Mistral Embed</option>
				</select>
			</div>
		{/if}
	</form>
</div>
