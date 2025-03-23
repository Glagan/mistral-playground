<script lang="ts">
	import type { OCRPageObject } from '@mistralai/mistralai/models/components';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import { slide } from 'svelte/transition';
	import PdfPage from './PdfPage.svelte';

	let {
		pages,
		loading,
		error
	}: { pages: OCRPageObject[]; loading: boolean; error: { text: string; body?: object } | null } = $props();
</script>

<div id="pages-container" class="flex flex-col flex-grow flex-shrink gap-4 w-full overflow-auto">
	{#if pages.length > 0}
		{#each pages as page, index (page.index)}
			<PdfPage page={pages[index]} {loading} />
		{/each}
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
</div>
