<script lang="ts">
	import Message from '$lib/components/Message.svelte';
	import type { Answer, Question } from '$lib/types';

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
		messages: (Question | Answer)[];
		loading: boolean;
		interactive?: boolean;
		moveUp: (message: Question | Answer) => void;
		moveDown: (message: Question | Answer) => void;
		refresh: (message: Question | Answer) => void;
		previousVersion: (message: Question | Answer) => void;
		nextVersion: (message: Question | Answer) => void;
		deleteVersion: (message: Question | Answer) => void;
		updateMessage: (message: Question | Answer, content: string) => void;
		deleteMessage: (message: Question | Answer) => void;
	}>();

	// TODO delayed fade-in per messages
</script>

<div id="messages-container" class="flex flex-col flex-grow gap-4 flex-shrink w-full overflow-auto">
	{#if messages.length > 0}
		{#each messages as message, index (message.id)}
			<Message
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
