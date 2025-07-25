<script lang="ts">
	import type { OCRPageObject } from '@mistralai/mistralai/models/components';
	import PdfPage from './PdfPage.svelte';
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

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
		<Alert.Root variant="destructive">
			<AlertCircleIcon />
			<Alert.Description>
				<p>{error.text}</p>
				{#if error.body}
					<CodeBlock language="json" code={JSON.stringify(error.body, undefined, 4)} />
				{/if}
			</Alert.Description>
		</Alert.Root>
	{/if}
</div>
