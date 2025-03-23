<script lang="ts">
	import type { OCRPageObject } from '@mistralai/mistralai/models/components';
	import hljs from 'highlight.js/lib/core';
	import { marked } from 'marked';
	import markedKatex from 'marked-katex-extension';

	let { page, loading }: { page: OCRPageObject; loading: boolean } = $props();
	marked.use(markedKatex({ throwOnError: false }));

	const markdown = $derived.by(() => {
		let markdown = page.markdown;
		for (let index = 0; index < page.images.length; index++) {
			const image = page.images[index];
			markdown = markdown.replaceAll(`(${image.id})`, `(${image.imageBase64})`);
		}
		return (marked.parse(markdown, { async: false, gfm: true, breaks: true }) as string).trim();
	});

	$effect(() => {
		page.markdown;
		hljs.highlightAll();
	});
</script>

<div class="text-center">
	<div class="text-neutral-600">{page.index + 1}</div>
</div>
<div class="card p-4 variant-ghost-primary text-primary-300">
	<div class="space-y-4 rendered-markdown max-w-full overflow-x-hidden">
		{@html markdown}
	</div>
</div>

<style>
</style>
