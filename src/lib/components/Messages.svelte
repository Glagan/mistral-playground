<script lang="ts">
	import MessageSvelte from '$lib/components/Message.svelte';
	import type { Message } from '$lib/types';

	const {
		messages,
		loading,
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

	// TODO delayed fade-in per messages
</script>

<div id="messages-container" class="flex flex-col flex-grow flex-shrink gap-4 w-full overflow-auto">
	{#if messages.length > 0}
		{#each messages as message, index (message.id)}
			<MessageSvelte
				bind:message
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
</div>
