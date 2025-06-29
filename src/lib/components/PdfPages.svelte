<script lang="ts">
	import type { OCRPageObject } from '@mistralai/mistralai/models/components';
	import { slide } from 'svelte/transition';
	import PdfPage from './PdfPage.svelte';
	import CodeBlock from './CodeBlock.svelte';

	let {
		pages,
		loading,
		error
	}: { pages: OCRPageObject[]; loading: boolean; error: { text: string; body?: object } | null } = $props();
</script>

<div id="pages-container" class="flex w-full shrink grow flex-col gap-4 overflow-auto">
	{#if pages.length > 0}
		{#each pages as page, index (page.index)}
			<PdfPage page={pages[index]} {loading} />
		{/each}
	{/if}
	{#if error}
		<aside class="alert variant-ghost-error flex flex-col items-start gap-2" transition:slide={{ axis: 'y' }}>
			<div class="alert-message rendered-markdown space-y-4">
				{error.text}
			</div>
			<CodeBlock code={JSON.stringify(error.body, undefined, 4)} language="json" />
		</aside>
	{/if}
</div>
