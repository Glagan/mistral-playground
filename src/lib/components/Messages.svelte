<script lang="ts">
	import MessageSvelte from '$lib/components/Message.svelte';
	import type { Message } from '$lib/types';
	import hljs from 'highlight.js/lib/core';
	import RefreshCwIcon from 'lucide-svelte/icons/refresh-cw';
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
		deleteMessage,
		generate
	}: {
		messages: Message[];
		loading: boolean;
		error: { text: string; body?: object } | null;
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
		error && error.body ? hljs.highlight('json', JSON.stringify(error.body, null, 4)).value : null
	);

	$inspect(error);
	$inspect(renderedError);
</script>

<div id="messages-container" class="flex flex-col flex-grow flex-shrink gap-4 w-full overflow-auto">
	{#if messages.length > 0}
		{#each messages as message, index (message.id)}
			<MessageSvelte
				message={messages[index]}
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
				{error.text}
			</div>
			{#if renderedError}
				<div>{@html renderedError}</div>
			{/if}
		</aside>
	{/if}
</div>
