<script lang="ts">
	import type { OCRPageObject } from '@mistralai/mistralai/models/components';
	import hljs from 'highlight.js/lib/core';
	import { marked } from 'marked';
	import markedKatex from 'marked-katex-extension';
	import * as Card from '$lib/components/ui/card/index.js';

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

<Card.Root class="w-full gap-3 py-3">
	<Card.Content class="rendered-markdown relative max-w-full space-y-4 overflow-x-hidden px-3">
		{@html markdown}
	</Card.Content>
</Card.Root>
