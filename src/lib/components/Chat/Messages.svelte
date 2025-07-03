<script lang="ts">
	import MessageSvelte from '$lib/components/Chat/Message.svelte';
	import type { Message } from '$lib/types';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import { slide } from 'svelte/transition';
	import type { MessageInteraction } from '$lib/message';
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

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

<div id="messages-container" class="flex w-full shrink grow flex-col gap-4 overflow-auto">
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
			<div class="flex w-full shrink-0 grow items-center justify-center">
				<Button disabled={loading} onclick={interact.generate}>
					<RefreshCwIcon size={16} />
					<span>Generate response</span>
				</Button>
			</div>
		</div>
	{/if}
	{#if error}
		<aside class="alert variant-ghost-error flex flex-col items-start gap-2" transition:slide={{ axis: 'y' }}>
			<div class="alert-message rendered-markdown space-y-4">
				{error.text}
			</div>
			{#if error.body}
				<CodeBlock language="json" code={JSON.stringify(error.body, undefined, 4)} />
			{/if}
		</aside>
	{/if}
</div>
