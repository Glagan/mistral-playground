<script lang="ts">
	import type { Message } from '$lib/types';
	import FileMessagePreview from '$lib/components/File/MessagePreview.svelte';
	import { Streamdown } from 'svelte-streamdown';
	import { mode } from 'mode-watcher';

	let { message }: { message: Message } = $props();

	const content = $state(message.versions[message.index].content);

	const parts = $derived(
		content.map((part) => {
			if (part.type === 'text') {
				return part.text.trim().replaceAll('<think>', '<div think>').replaceAll('</think>', '</div>');
			}
			return '';
		})
	);

	const shikiTheme = $derived(mode.current === 'light' ? 'github-light' : 'github-dark');
	const theme = $derived(
		mode.current === 'light'
			? {
					code: {
						container: 'bg-muted/20',
						pre: 'bg-transparent'
					}
				}
			: {}
	);
</script>

{#if message.role === 'assistant' && message.versions[message.index].thinking}
	<div
		class="text-muted-foreground border-muted-foreground max-h-80 overflow-y-scroll border-l-2 pl-2 whitespace-pre-wrap italic"
	>
		{message.versions[message.index].thinking}
	</div>
{/if}
<div class="rendered-markdown">
	{#each content as item, index (index)}
		{#if item.type === 'text'}
			{#each parts as part}
				<Streamdown
					content={part}
					baseTheme="shadcn"
					{shikiTheme}
					animation={{ enabled: true, type: 'fade' }}
					class="space-y-4"
					{theme}
				/>
			{/each}
		{:else if item.type === 'image_url' || item.type === 'document_url'}
			<FileMessagePreview chunk={item} />
		{/if}
	{/each}
</div>
