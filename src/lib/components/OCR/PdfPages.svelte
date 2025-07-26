<script lang="ts">
	import type { OCRPageObject } from '@mistralai/mistralai/models/components';
	import PdfPage from './PdfPage.svelte';

	let { pages, loading }: { pages: OCRPageObject[]; loading: boolean } = $props();
</script>

<div id="pages-container" class="flex w-full shrink grow flex-col gap-4 overflow-auto">
	{#if pages.length > 0}
		{#each pages as page, index (page.index)}
			<PdfPage page={pages[index]} {loading} />
		{/each}
	{/if}
</div>
