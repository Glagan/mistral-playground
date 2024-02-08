<script lang="ts">
	import Message from '$lib/components/Message.svelte';
	import type { Answer, Question } from '$lib/types';

	const { messages } = $props<{
		messages: (Question | Answer)[];
	}>();
</script>

<div class="flex flex-col flex-grow gap-4 flex-shrink w-full overflow-auto">
	{#if messages.length > 0}
		{#each messages as message}
			<Message {message} />
		{/each}
	{/if}
</div>
