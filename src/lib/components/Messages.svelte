<script lang="ts">
	import MessageSvelte from '$lib/components/Message.svelte';
	import type { Message } from '$lib/types';
	import { marked } from 'marked';
	import { slide } from 'svelte/transition';

	let {
		messages,
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
		deleteMessage
	} = $props<{
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
	}>();

	let renderedError = $derived((marked.parse(error.trim(), { async: false }) as string).trim());
</script>

<div id="messages-container" class="flex flex-col flex-grow flex-shrink gap-4 w-full overflow-auto">
	{#if messages.length > 0}
		{#each messages as message, index (message.id)}
			<MessageSvelte
				{message}
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
	{#if error}
		<aside class="alert variant-ghost-error" transition:slide={{ axis: 'y' }}>
			<div class="alert-message">
				{@html renderedError}
			</div>
		</aside>
	{/if}
</div>
