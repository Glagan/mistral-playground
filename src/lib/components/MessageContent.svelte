<script lang="ts">
	import type { Message } from '$lib/types';
	import { marked } from 'marked';
	import hljs from 'highlight.js/lib/core';
	import FileMessagePreview from './FileMessagePreview.svelte';

	let {
		message
	}: {
		message: Message;
	} = $props();

	const content = $state(message.versions[message.index].content);

	const markdown = $derived.by(() => {
		return content.map((part) =>
			part.type === 'text' ? marked.parse(part.text.trim(), { async: false, gfm: true, breaks: true }).trim() : ''
		);
	});

	$effect(() => {
		message.versions[message.index].content;
		hljs.highlightAll();
	});
</script>

<div class="space-y-4 rendered-markdown">
	{#each content as item, index (index)}
		{#if item.type === 'text'}
			{@html markdown[index]}
		{:else if item.type === 'image_url' || item.type === 'document_url'}
			<FileMessagePreview chunk={item} />
		{/if}
	{/each}
</div>
