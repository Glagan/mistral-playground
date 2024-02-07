<script lang="ts">
	import Message from '$lib/components/Message.svelte';
	import type { Answer, Question } from '$lib/types';

	const { messages } = $props<{ messages: (Question | Answer)[] }>();
</script>

<div class="flex flex-col gap-4 flex-shrink w-full" class:flex-grow={messages.length === 0}>
	{#if messages.length > 0}
		{#each messages as message}
			<Message {message} />
		{/each}
	{/if}
</div>
