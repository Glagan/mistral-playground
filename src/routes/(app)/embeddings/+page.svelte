<script lang="ts">
	import { fade } from 'svelte/transition';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/stores/apiKey';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import { getClientForRequest } from '$lib/mistral';
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import { models } from '$lib/stores/models.svelte';
	import ModelError from '$lib/components/ModelError.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import Options from './Options.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import { embeddings } from '$lib/stores/embeddings.svelte';
	import BracesIcon from '@lucide/svelte/icons/braces';
	import { toast } from 'svelte-sonner';
	import { extractErrorContent } from '$lib/utils/error';
	import ErrorBlock from '$lib/components/ErrorBlock.svelte';
	import SquareTerminalIcon from '@lucide/svelte/icons/square-terminal';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	if (browser && !$apiKey) {
		goto('/', { replaceState: true });
	}

	const encoding = get_encoding('cl100k_base');

	const tokens = $derived(encoding.encode(embeddings.state.promptText).length);

	let loading = $state(false);
	let error: { text: string; body?: object } | null = $state(null);
	let isInvalid = $derived(loading || models.loading || !!models.error || !embeddings.state.promptText);

	async function onSubmit(event?: Event) {
		event?.preventDefault();

		loading = true;
		embeddings.state.result = [];
		error = null;

		try {
			const client = getClientForRequest({ apiKey: $apiKey, endpoint: $settings.endpoint });
			const body = await client.embeddings.create({
				model: embeddings.state.options.model,
				inputs: [embeddings.state.promptText],
				outputDimension:
					embeddings.state.options.model === 'mistral-embed' ? null : embeddings.state.options.outputDimension,
				outputDtype: embeddings.state.options.model === 'mistral-embed' ? 'float' : embeddings.state.options.outputDtype
			});
			embeddings.state.result = body.data[0].embedding ?? [];
		} catch (__error) {
			const _error = __error as Error;
			console.error(_error);
			error = extractErrorContent(_error);
			return;
		} finally {
			loading = false;
		}
	}

	function onKeypress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			if (!isInvalid) {
				onSubmit();
			}
		}
	}

	async function copyAsJson() {
		try {
			await navigator.clipboard.writeText(JSON.stringify(embeddings.state.result));
			toast.success('Embeddings copied');
		} catch (error) {
			toast.success('Failed to copy embeddings');
		}
	}
</script>

<div class="flex max-h-[calc(100svh-80px)] shrink grow flex-row gap-0">
	<Options class="hidden lg:flex" />
	<div class="relative flex h-full w-[calc(75vw-4rem-var(--sidebar-width))] flex-1 flex-col gap-4">
		<div class="flex-1 overflow-y-auto px-4">
			{#if error}
				<ErrorBlock {error} />
			{:else if embeddings.state.result.length > 0}
				<div class="card overflow-x-hidden">
					<CodeBlock code={embeddings.state.result.join(',')} language="json" />
				</div>
			{:else if loading}
				<div class="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-3 text-center">
					<Skeleton class="h-7 w-1/3" />
					<Skeleton class="h-7 w-1/2" />
					<Skeleton class="h-7 w-1/3" />
				</div>
			{:else}
				<div
					class="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-3 text-center"
					style="background: radial-gradient(circle,rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 30%) ;"
				>
					<SquareTerminalIcon size={52} />
					<p class="text-muted-foreground leading-7">Your embeddings will appear here...</p>
				</div>
			{/if}
		</div>
		{#if embeddings.state.result.length > 0}
			<div class="text-center">
				<Button onclick={() => copyAsJson()}>
					<BracesIcon />
					<span>Copy as JSON</span>
				</Button>
			</div>
		{/if}
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
						readonly={loading || !!models.error}
						placeholder="Type something..."
						onkeypress={onKeypress}
						bind:value={embeddings.state.promptText}
					/>
				</div>
			</label>
			<div class="flex flex-row justify-between gap-2 lg:justify-end">
				<Drawer.Root direction="right">
					<Drawer.Trigger class="block lg:hidden" type="button" onclick={(event) => event.stopImmediatePropagation()}>
						<SlidersHorizontalIcon size={20} />
					</Drawer.Trigger>
					<Drawer.Content class="flex max-h-screen overflow-auto p-4">
						<Options />
					</Drawer.Content>
				</Drawer.Root>
				<Button type="submit" disabled={isInvalid}>
					Submit
					<SendHorizontalIcon />
				</Button>
			</div>
		</form>
	</div>
</div>
