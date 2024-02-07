<script lang="ts">
	import { scale } from 'svelte/transition';
	import Message from './Message.svelte';
	import type { Answer, Question } from '$lib/types';

	const { messages } = $props<{ messages: (Question | Answer)[] }>();
</script>

<div
	class="flex flex-col gap-4 flex-shrink w-full"
	class:flex-grow={messages.length === 0}
	transition:scale
>
	{#if messages.length > 0}
		{#each messages as message}
			<Message {message} />
		{/each}
	{/if}
</div>
