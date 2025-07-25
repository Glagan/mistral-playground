<script lang="ts">
	import type { Message } from '$lib/types';
	import { marked } from 'marked';
	import hljs from 'highlight.js/lib/core';
	import FileMessagePreview from '$lib/components/File/MessagePreview.svelte';
	import { emitter } from '$lib/emitter';
	import { onDestroy, onMount } from 'svelte';

	let {
		message
	}: {
		message: Message;
	} = $props();

	const content = $state(message.versions[message.index].content);

	const markdown = $derived.by(() => {
		return content.map((part) =>
			part.type === 'text'
				? marked
						.parse(part.text.trim().replaceAll('<think>', '<div think>').replaceAll('</think>', '</div>'), {
							async: false,
							gfm: true,
							breaks: true
						})
						.trim()
				: ''
		);
	});

	onMount(() => {
		emitter.on('message:complete', () => {
			hljs.highlightAll();
		});
		hljs.highlightAll();
	});

	onDestroy(() => {
		emitter.off('message:complete');
	});
</script>

{#if message.role === 'assistant' && message.versions[message.index].thinking}
	<div
		class="text-muted-foreground border-muted-foreground max-h-80 overflow-y-scroll border-l-2 pl-2 whitespace-pre-wrap italic"
	>
		{message.versions[message.index].thinking}
	</div>
{/if}
<div class="rendered-markdown space-y-4">
	{#each content as item, index (index)}
		{#if item.type === 'text'}
			{@html markdown[index]}
		{:else if item.type === 'image_url' || item.type === 'document_url'}
			<FileMessagePreview chunk={item} />
		{/if}
	{/each}
</div>
