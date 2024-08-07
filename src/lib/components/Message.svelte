<script lang="ts">
	import type { Message } from '$lib/types';
	import { marked } from 'marked';
	import { tick } from 'svelte';
	import { slide } from 'svelte/transition';
	import hljs from 'highlight.js/lib/core';
	import ArrowDownIcon from 'lucide-svelte/icons/arrow-down';
	import ArrowUpIcon from 'lucide-svelte/icons/arrow-up';
	import ChevronLeftIcon from 'lucide-svelte/icons/chevron-left';
	import ChevronRightIcon from 'lucide-svelte/icons/chevron-right';
	import PencilIcon from 'lucide-svelte/icons/pencil';
	import RefreshCwIcon from 'lucide-svelte/icons/refresh-cw';
	import Trash2Icon from 'lucide-svelte/icons/trash-2';
	import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';

	let {
		message,
		loading,
		isFirst,
		isLast,
		interact
	}: {
		message: Message;
		loading: boolean;
		isFirst: boolean;
		isLast: boolean;
		interact?: {
			moveUp: (message: Message) => void;
			moveDown: (message: Message) => void;
			refresh: (message: Message) => void;
			previousVersion: (message: Message) => void;
			nextVersion: (message: Message) => void;
			deleteVersion: (message: Message) => void;
			updateMessage: (message: Message, content: string) => void;
			deleteMessage: (message: Message) => void;
		};
	} = $props();

	const markdown = $derived.by(() => {
		return (
			marked.parse(message.content[message.index].trim(), { async: false, gfm: true, breaks: true }) as string
		).trim();
	});

	$effect(() => {
		message.content[message.index];
		hljs.highlightAll();
	});

	let editing = $state(false);
	let localType: 'user' | 'assistant' | 'system' = $state('user');
	let localCopy = $state('');
	let textarea: HTMLTextAreaElement | null = $state(null);

	function startEditing() {
		editing = true;
		localType = $state.snapshot(message.type);
		localCopy = $state.snapshot(message.content[message.index]);
		tick().then(() => {
			if (textarea) {
				textarea.focus();
				textarea.selectionStart = textarea.value.length;
			}
		});
	}

	function cancelEdit() {
		editing = false;
		tick().then(() => hljs.highlightAll());
	}

	function stopEditing() {
		editing = false;
		message.type = $state.snapshot(localType);
		message.content[message.index] = $state.snapshot(localCopy);
		interact?.updateMessage(message, message.content[message.index]);
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
		class="flex-grow flex-shrink-0 {message.type === 'system' ? 'w-full' : 'w-[75%] lg:max-w-[75%]'} {variants[
			message.type
		].blockMargin}"
	>
		<p class="text-xs opacity-75 {variants[message.type].titlePosition} {variants[message.type].titleVariant}">
			{variants[message.type].title}
		</p>
		<div class="card p-4 {variants[message.type].style} overflow-x-hidden">
			{#if editing}
				<RadioGroup class="mb-2">
					<RadioItem bind:group={localType} name="justify" value="system">System</RadioItem>
					<RadioItem bind:group={localType} name="justify" value="user">User</RadioItem>
					<RadioItem bind:group={localType} name="justify" value="assistant">Assistant</RadioItem>
				</RadioGroup>
			{/if}
			{#if message.content[message.index].length === 0}
				<div class="text-surface-200 text-opacity-75 italic">Loading...</div>
			{:else if editing}
				<textarea bind:this={textarea} bind:value={localCopy} class="textarea w-full" rows="10"></textarea>
			{:else}
				<div class="space-y-4 rendered-markdown">
					{@html markdown}
				</div>
			{/if}
			{#if interact}
				<div
					class="flex flex-col lg:flex-row gap-2 flex-grow flex-shrink items-end lg:items-center pt-2 justify-between transition-all"
					transition:slide={{ axis: 'y' }}
				>
					{#if message.content.length > 1 && !editing}
						<div class="flex flex-row gap-2 items-center flex-grow flex-shrink">
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || message.index === 0}
								onclick={() => interact.previousVersion(message)}
							>
								<ChevronLeftIcon size={16} />
							</button>
							<span> {message.index + 1} / {message.content.length}</span>
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || message.index >= message.content.length - 1}
								onclick={() => interact.nextVersion(message)}
							>
								<ChevronRightIcon size={16} />
							</button>
							<button
								type="button"
								class="btn btn-sm variant-soft-warning transition-all disabled:opacity-75"
								disabled={loading}
								onclick={() => interact.deleteVersion(message)}
							>
								<Trash2Icon size={16} />
							</button>
						</div>
					{:else}
						<div class="flex-grow flex-shrink"></div>
					{/if}
					<div class="flex flex-row gap-2 items-center flex-shrink-0 flex-wrap">
						{#if editing}
							<button
								type="button"
								class="btn btn-sm variant-soft-warning transition-all disabled:opacity-75"
								disabled={loading}
								onclick={cancelEdit}
							>
								Cancel
							</button>
							<button
								type="button"
								class="btn btn-sm variant-soft-tertiary transition-all disabled:opacity-75"
								disabled={loading}
								onclick={stopEditing}
							>
								Save
							</button>
						{:else}
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || isFirst}
								onclick={() => interact.moveUp(message)}
							>
								<ArrowUpIcon size={16} />
							</button>
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || isLast}
								onclick={() => interact.moveDown(message)}
							>
								<ArrowDownIcon size={16} />
							</button>
							<button
								type="button"
								class="btn btn-sm variant-soft-tertiary transition-all disabled:opacity-75"
								disabled={loading}
								onclick={startEditing}
							>
								<PencilIcon size={16} />
							</button>
							{#if message.type === 'assistant'}
								<button
									type="button"
									class="btn btn-sm variant-soft-primary transition-all disabled:opacity-75"
									disabled={loading}
									onclick={() => interact.refresh(message)}
								>
									<RefreshCwIcon size={16} />
								</button>
							{/if}
							<button
								type="button"
								class="btn btn-sm variant-soft-error transition-all disabled:opacity-75"
								disabled={loading}
								onclick={() => interact.deleteMessage(message)}
							>
								<Trash2Icon size={16} />
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
