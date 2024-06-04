<script lang="ts">
	import MessageSvelte from '$lib/components/Message.svelte';
	import type { Message } from '$lib/types';
	import RefreshCwIcon from 'lucide-svelte/icons/refresh-cw';
	import { marked } from 'marked';
	import { slide } from 'svelte/transition';

	let {
		messages = $bindable(),
		loading,
		error,
		interactive,
		moveUp,
		moveDown,
		refresh,
		previousVersion,
		nextVersion,
		deleteVersion,
		updateMessage,
		deleteMessage,
		generate
	}: {
		messages: Message[];
		loading: boolean;
		error: string;
		interactive?: boolean;
		moveUp: (message: Message) => void;
		moveDown: (message: Message) => void;
		refresh: (message: Message) => void;
		previousVersion: (message: Message) => void;
		nextVersion: (message: Message) => void;
		deleteVersion: (message: Message) => void;
		updateMessage: (message: Message, content: string) => void;
		deleteMessage: (message: Message) => void;
		generate: (event: Event) => void;
	} = $props();

	let renderedError = $derived(
		(marked.parse(error.trim(), { async: false, gfm: true, breaks: true }) as string).trim()
	);
</script>

<div id="messages-container" class="flex flex-col flex-grow flex-shrink gap-4 w-full overflow-auto">
	{#if messages.length > 0}
		{#each messages as message, index (message.id)}
			<MessageSvelte
				bind:message={messages[index]}
				isFirst={index === 0}
				isLast={index === messages.length - 1}
				{loading}
				{interactive}
				{moveUp}
				{moveDown}
				{refresh}
				{previousVersion}
				{nextVersion}
				{deleteVersion}
				{updateMessage}
				{deleteMessage}
			/>
		{/each}
	{/if}
	{#if messages.length && messages[messages.length - 1].type === 'user'}
		<div class="flex flex-row flex-nowrap">
			<div class="flex items-center justify-center flex-grow flex-shrink-0 w-full">
				<button
					type="button"
					class="btn btn-lg variant-soft-primary transition-all disabled:opacity-75"
					disabled={loading}
					onclick={generate}
				>
					<RefreshCwIcon size={16} />
					<span>Generate response</span>
				</button>
			</div>
		</div>
	{/if}
	{#if error}
		<aside class="alert variant-ghost-error" transition:slide={{ axis: 'y' }}>
			<div class="alert-message space-y-4 rendered-markdown">
				{@html renderedError}
			</div>
		</aside>
	{/if}
</div>
