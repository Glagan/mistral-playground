<script lang="ts">
	import type { Message } from '$lib/types';
	import { marked } from 'marked';
	import { tick, unstate } from 'svelte';
	import { slide } from 'svelte/transition';
	import hljs from 'highlight.js/lib/core';

	let {
		message,
		loading,
		isFirst,
		isLast,
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
		message: Message;
		loading: boolean;
		isFirst: boolean;
		isLast: boolean;
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

	let currentMessage = $derived(message.content[message.index]);
	const markdown = $derived(
		(marked.parse(currentMessage.trim(), { async: false }) as string).trim()
	);

	$effect(() => {
		message.content[message.index];
		hljs.highlightAll();
	});

	let editing = $state(false);
	let localCopy = $state('');

	function startEditing() {
		editing = true;
		localCopy = unstate(currentMessage);
	}

	function stopEditing() {
		editing = false;
		message.content[message.index] = unstate(localCopy);
		updateMessage(message, message.content[message.index]);
		tick().then(() => hljs.highlightAll());
	}

	const variants = {
		user: {
			title: 'User',
			blockMargin: '',
			titlePosition: 'text-left',
			titleVariant: 'text-secondary-300',
			style: 'variant-ghost-secondary'
		},
		assistant: {
			title: 'Assistant',
			blockMargin: 'ml-auto',
			titlePosition: 'text-right',
			titleVariant: 'text-primary-500',
			style: 'variant-ghost-primary'
		},
		error: {
			title: 'Error',
			blockMargin: 'ml-auto',
			titlePosition: 'text-right',
			titleVariant: 'text-error-300',
			style: 'variant-ghost-error'
		},
		system: {
			title: 'System',
			blockMargin: '',
			titlePosition: 'text-left',
			titleVariant: 'text-tertiary-300',
			style: 'variant-ghost-tertiary'
		}
	};
</script>

<div class="flex flex-row flex-nowrap">
	<div
		class="flex-grow flex-shrink-0 {message.type === 'system'
			? 'w-full'
			: 'w-[75%] lg:max-w-[75%]'} {variants[message.type].blockMargin}"
	>
		<p
			class="text-xs opacity-75 {variants[message.type].titlePosition} {variants[message.type]
				.titleVariant}"
		>
			{variants[message.type].title}
		</p>
		<div class="card p-4 {variants[message.type].style} overflow-x-hidden">
			{#if currentMessage.length === 0}
				<div class="text-surface-200 text-opacity-75 italic">Loading...</div>
			{:else if editing}
				<textarea bind:value={localCopy} class="textarea w-full" rows="10"></textarea>
			{:else}
				<div class="whitespace-pre-wrap">
					{@html markdown}
				</div>
			{/if}
			{#if interactive}
				<div
					class="flex gap-2 flex-grow flex-shrink items-center pt-2 justify-between transition-all"
					transition:slide={{ axis: 'y' }}
				>
					{#if message.content.length > 1 && !editing}
						<div class="flex flex-row gap-2 items-center flex-grow flex-shrink">
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || message.index === 0}
								onclick={() => previousVersion(message)}
							>
								Previous
							</button>
							<span> {message.index + 1} / {message.content.length}</span>
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || message.index >= message.content.length - 1}
								onclick={() => nextVersion(message)}
							>
								Next
							</button>
							<button
								type="button"
								class="btn btn-sm variant-soft-warning transition-all disabled:opacity-75"
								disabled={loading}
								onclick={() => deleteVersion(message)}
							>
								Delete
							</button>
						</div>
					{:else}
						<div class="flex-grow flex-shrink"></div>
					{/if}
					<div class="flex flex-row gap-2 items-center flex-shrink-0">
						{#if editing}
							<button
								type="button"
								class="btn btn-sm variant-soft-tertiary transition-all disabled:opacity-75"
								disabled={loading}
								onclick={stopEditing}
							>
								Done
							</button>
						{:else}
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || isFirst}
								onclick={() => moveUp(message)}
							>
								Up
							</button>
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || isLast}
								onclick={() => moveDown(message)}
							>
								Down
							</button>
							<button
								type="button"
								class="btn btn-sm variant-soft-tertiary transition-all disabled:opacity-75"
								disabled={loading}
								onclick={startEditing}
							>
								Edit
							</button>
							{#if message.type === 'assistant'}
								<button
									type="button"
									class="btn btn-sm variant-soft-primary transition-all disabled:opacity-75"
									disabled={loading}
									onclick={() => refresh(message)}
								>
									Refresh
								</button>
							{/if}
							<button
								type="button"
								class="btn btn-sm variant-soft-error transition-all disabled:opacity-75"
								disabled={loading}
								onclick={() => deleteMessage(message)}
							>
								Delete
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
		{#if message.usage}
			<p class="text-xs opacity-75 text-right text-primary-500">
				Prompt: <span class="text-primary-400">{message.usage.prompt_tokens}</span> / Completion:
				<span class="text-primary-400">{message.usage.completion_tokens}</span>
				/ Total: <span class="text-primary-400">{message.usage.total_tokens}</span>
			</p>
		{/if}
	</div>
</div>
