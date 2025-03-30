<script lang="ts">
	import MessageSvelte from '$lib/components/Message.svelte';
	import type { Message } from '$lib/types';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	import RefreshCwIcon from 'lucide-svelte/icons/refresh-cw';
	import { slide } from 'svelte/transition';
	import type { MessageInteraction } from '$lib/message';

	let {
		messages,
		loading,
		error,
		interact
	}: {
		messages: Message[];
		loading: boolean;
		error: { text: string; body?: object } | null;
		interact?: MessageInteraction;
	} = $props();
</script>

<div id="messages-container" class="flex flex-col flex-grow flex-shrink gap-4 w-full overflow-auto">
	{#if messages.length > 0}
		{#each messages as message, index (message.id + message.index)}
			<MessageSvelte
				message={messages[index]}
				{index}
				isFirst={index === 0}
				isLast={index === messages.length - 1}
				{loading}
				{interact}
			/>
		{/each}
	{/if}
	{#if interact && messages.length && messages[messages.length - 1].role === 'user'}
		<div class="flex flex-row flex-nowrap">
			<div class="flex items-center justify-center flex-grow flex-shrink-0 w-full">
				<button
					type="button"
					class="btn btn-lg variant-soft-primary transition-all disabled:opacity-75"
					disabled={loading}
					onclick={interact.generate}
				>
					<RefreshCwIcon size={16} />
					<span>Generate response</span>
				</button>
			</div>
		</div>
	{/if}
	{#if error}
		<aside class="flex flex-col gap-2 items-start alert variant-ghost-error" transition:slide={{ axis: 'y' }}>
			<div class="alert-message space-y-4 rendered-markdown">
				{error.text}
			</div>
			{#if error.body}
				<CodeBlock language="json" code={JSON.stringify(error.body, undefined, 4)} class="!ml-0 w-full"></CodeBlock>
			{/if}
		</aside>
	{/if}
</div>
