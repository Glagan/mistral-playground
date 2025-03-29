<script lang="ts">
	import type { Message } from '$lib/types';
	import { marked } from 'marked';
	import hljs from 'highlight.js/lib/core';
	import type { ContentChunk, TextChunk } from '@mistralai/mistralai/models/components';

	let {
		message
	}: {
		message: Message;
	} = $props();

	const content = $derived.by(() => {
		if (typeof message.versions[message.index].content === 'string') {
			return [{ type: 'text' as const, text: message.versions[message.index].content as string }];
		}
		return (message.versions[message.index].content as TextChunk[] | ContentChunk[]) ?? [];
	});

	const markdown = $derived.by(() => {
		return content.map((part) =>
			part.type === 'text'
				? (marked.parse(part.text.trim(), { async: false, gfm: true, breaks: true }) as string).trim()
				: ''
		);
	});

	$effect(() => {
		message.versions[message.index];
		hljs.highlightAll();
	});
</script>

<div class="space-y-4 rendered-markdown">
	{#each content as item}
		{#if item.type === 'text'}
			{@html markdown}
		{:else if item.type === 'image_url'}
			IMAGE
		{:else if item.type === 'document_url'}
			DOCUMENT
		{/if}
	{/each}
</div>
