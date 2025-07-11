<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/stores/apiKey';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import { marked } from 'marked';
	import { getClientForRequest } from '$lib/mistral';
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import { models } from '$lib/stores/models.svelte';
	import ModelError from '$lib/components/ModelError.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import Options from './Options.svelte';
	import type { EmbeddingType } from '$lib/types';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';

	if (browser && !$apiKey) {
		goto('/', { replaceState: true });
	}

	const encoding = get_encoding('cl100k_base');

	let showOptions = $state(false);
	let model = $state('mistral-embed');
	let outputDimensions = $state<number | null>(null);
	let outputType = $state<EmbeddingType>('float');
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
			const body = await client.embeddings.create({
				model,
				inputs: [promptText],
				outputDimension: model === 'mistral-embed' ? null : outputDimensions,
				outputDtype: model === 'mistral-embed' ? 'float' : outputType
			});
			embeddings = body.data[0].embedding ?? [];
		} catch (_error) {
			console.error(_error);
			error = `Failed to send request: ${error}`;
			return;
		} finally {
			loading = false;
		}
	}

	function onreset() {
		embeddings = [];
		promptText = '';
		error = '';
		loading = false;
	}
</script>

<div class="flex max-h-[calc(100vh-80px)] shrink grow flex-row gap-0">
	<Options class="hidden lg:flex" bind:model bind:outputDimensions bind:outputType {onreset} />
	<div class="relative flex h-full w-full shrink grow flex-col gap-4">
		<div class="flex-1 overflow-y-auto px-4">
			{#if error}
				<Alert.Root variant="destructive">
					<TriangleAlertIcon />
					<Alert.Description>
						{@html renderedError}
					</Alert.Description>
				</Alert.Root>
			{/if}
			{#if embeddings.length > 0}
				<div class="card overflow-x-hidden">
					<CodeBlock code={embeddings.join(',')} language="json" />
				</div>
			{:else if loading}
				<div class="card variant-ghost-secondary overflow-x-hidden p-4">
					<span class="text-surface-200 italic">Loading...</span>
				</div>
			{/if}
		</div>
		<form class="flex shrink-0 flex-col gap-2 lg:px-4" onsubmit={onSubmit}>
			<ModelError />
			<label class="flex flex-col gap-1.5">
				<div class="flex items-center justify-end gap-2">
					{#if tokens > 0}
						<span class="text-xs" transition:fade>
							~<span class="text-stone-300">{tokens}</span> tokens
						</span>
					{/if}
				</div>
				<div class="relative">
					<Textarea
						rows={5}
						disabled={loading || !!models.error}
						placeholder="Type something..."
						bind:value={promptText}
					/>
				</div>
			</label>
			<div class="flex flex-row justify-between gap-2 lg:justify-end">
				<Drawer.Root direction="right">
					<Drawer.Trigger class="block lg:hidden" type="button" onclick={(event) => event.stopImmediatePropagation()}>
						<SlidersHorizontalIcon size={20} />
					</Drawer.Trigger>
					<Drawer.Content class="flex max-h-screen overflow-auto p-4">
						<Options bind:model bind:outputDimensions bind:outputType {onreset} />
					</Drawer.Content>
				</Drawer.Root>
				<Button type="submit" disabled={loading || models.loading || !!models.error || !promptText}>
					Submit
					<SendHorizontalIcon />
				</Button>
			</div>
		</form>
	</div>
</div>
