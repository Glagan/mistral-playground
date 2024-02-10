<script lang="ts">
	import type { Answer, Question } from '$lib/types';
	import { marked } from 'marked';
	import { slide } from 'svelte/transition';

	let {
		message,
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
		message: Question | Answer;
		isFirst: boolean;
		isLast: boolean;
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

	function onMessageChange(event: Event & { currentTarget: EventTarget & HTMLDivElement }) {
		updateMessage(message, event.currentTarget.innerText);
	}

	let currentMessage = $derived(message.content[message.index]);
	const markdown = $derived(
		(marked.parse(currentMessage.trim(), { async: false }) as string).trim()
	);
</script>

{#snippet actions({ message }: { message: Question | Answer })}
	<div
		class="flex gap-2 flex-grow flex-shrink items-center pt-2 justify-between"
		transition:slide={{ axis: 'y' }}
	>
		{#if message.content.length > 1}
			<div class="flex flex-row gap-2 items-center flex-grow flex-shrink">
				<button
					type="button"
					class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
					disabled={message.index === 0}
					onclick={() => previousVersion(message)}
				>
					Previous
				</button>
				<span> {message.index + 1} / {message.content.length}</span>
				<button
					type="button"
					class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
					disabled={message.index >= message.content.length - 1}
					onclick={() => nextVersion(message)}
				>
					Next
				</button>
				<button
					type="button"
					class="btn btn-sm variant-soft-warning transition-all disabled:opacity-75"
					onclick={() => deleteVersion(message)}
				>
					Delete
				</button>
			</div>
		{:else}
			<div class="flex-grow flex-shrink"></div>
		{/if}
		<div class="flex flex-row gap-2 items-center flex-shrink-0">
			<button
				type="button"
				class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
				disabled={isFirst}
				onclick={() => moveUp(message)}
			>
				Up
			</button>
			<button
				type="button"
				class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
				disabled={isLast}
				onclick={() => moveDown(message)}
			>
				Down
			</button>
			{#if message.type === 'assistant'}
				<button
					type="button"
					class="btn btn-sm variant-soft-primary transition-all disabled:opacity-75"
					onclick={() => refresh(message)}
				>
					Refresh
				</button>
			{/if}
			<button
				type="button"
				class="btn btn-sm variant-soft-error transition-all disabled:opacity-75"
				onclick={() => deleteMessage(message)}
			>
				Delete
			</button>
		</div>
	</div>
{/snippet}

<div class="flex flex-row flex-nowrap">
	{#if message.type === 'assistant'}
		<div class="flex-grow flex-shrink-0 w-[75%] lg:max-w-[75%] ml-auto">
			<p class="text-xs opacity-75 text-right text-primary-500">Answer</p>
			<div class="card p-4 variant-ghost-primary overflow-x-hidden">
				<div
					class="whitespace-pre-wrap cursor-pointer"
					contenteditable="true"
					oninput={onMessageChange}
				>
					{@html markdown}
				</div>
				{#if interactive}
					{@render actions({ message })}
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
	{:else if message.type === 'user'}
		<div class="flex-grow flex-shrink-0 w-[75%] lg:max-w-[75%]">
			<p class="text-xs opacity-75 text-secondary-300">Question</p>
			<div class="card p-4 variant-ghost-secondary overflow-x-hidden">
				<div
					class="whitespace-pre-wrap cursor-pointer"
					contenteditable="true"
					oninput={onMessageChange}
				>
					{@html markdown}
				</div>
				{#if interactive}
					{@render actions({ message })}
				{/if}
			</div>
		</div>
	{:else if message.type === 'error'}
		<div class="flex-grow flex-shrink-0 w-[75%] lg:max-w-[75%] ml-auto">
			<p class="text-xs opacity-75 text-error-300">Error</p>
			<div class="card p-4 variant-ghost-error overflow-x-hidden">
				<div
					class="whitespace-pre-wrap cursor-pointer"
					contenteditable="true"
					oninput={onMessageChange}
				>
					{@html markdown}
				</div>
				{#if interactive}
					{@render actions({ message })}
				{/if}
			</div>
		</div>
	{:else}
		<div class="w-full">
			<p class="text-xs opacity-75 text-tertiary-300">System</p>
			<div class="card p-4 variant-ghost-tertiary overflow-x-hidden">
				<div
					class="whitespace-pre-wrap cursor-pointer"
					contenteditable="true"
					oninput={onMessageChange}
				>
					{@html markdown}
				</div>
				{#if interactive}
					{@render actions({ message })}
				{/if}
			</div>
		</div>
	{/if}
</div>
