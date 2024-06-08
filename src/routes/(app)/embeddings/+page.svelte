<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { CodeBlock, focusTrap } from '@skeletonlabs/skeleton';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/stores/apiKey';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import Settings2Icon from 'lucide-svelte/icons/settings-2';
	import { marked } from 'marked';
	import { getClientForRequest } from '$lib/mistral';

	if (browser && !$apiKey) {
		goto('/', { replaceState: true });
	}

	const encoding = get_encoding('cl100k_base');

	let showOptions = $state(false);
	let model = $state('mistral-embed');
	let promptText = $state('');

	const tokens = $derived(encoding.encode(promptText).length);

	let loading = $state(false);
	let error = $state('');
	let renderedError = $derived(
		(marked.parse(error.trim(), { async: false, gfm: true, breaks: true }) as string).trim()
	);

	let embeddings: number[] = $state([]);

	async function onSubmit(event: Event) {
		event.preventDefault();

		loading = true;
		showOptions = false;
		embeddings = [];
		error = '';

		try {
			const client = getClientForRequest({ apiKey: $apiKey, endpoint: $settings.endpoint });
			const body = await client.embeddings({
				model,
				input: [promptText]
			});
			console.log(body);
			embeddings = body.data[0].embedding;
		} catch (_error) {
			console.error(_error);
			error = `Failed to send request: ${error}`;
			return;
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="flex flex-grow flex-shrink justify-center items-stretch flex-col gap-4 p-4 max-h-[calc(100vh-88px)] lg:max-h-screen"
>
	<div class="flex flex-col flex-grow flex-shrink gap-4 w-full overflow-auto">
		{#if error}
			<aside class="alert variant-ghost-error" transition:slide={{ axis: 'y' }}>
				<div class="alert-message space-y-4 rendered-markdown">
					{@html renderedError}
				</div>
			</aside>
		{/if}
		{#if embeddings.length > 0}
			<div class="card overflow-x-hidden">
				<CodeBlock language="txt" code={embeddings.join(', ')}></CodeBlock>
			</div>
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
			></textarea>
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
