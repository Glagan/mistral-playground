<script lang="ts">
	import type { Message, MessageRole } from '$lib/types';
	import { slide } from 'svelte/transition';
	import ArrowDownIcon from 'lucide-svelte/icons/arrow-down';
	import ArrowUpIcon from 'lucide-svelte/icons/arrow-up';
	import ChevronLeftIcon from 'lucide-svelte/icons/chevron-left';
	import ChevronRightIcon from 'lucide-svelte/icons/chevron-right';
	import PencilIcon from 'lucide-svelte/icons/pencil';
	import RefreshCwIcon from 'lucide-svelte/icons/refresh-cw';
	import Trash2Icon from 'lucide-svelte/icons/trash-2';
	import MessageContent from './MessageContent.svelte';
	import MessageEditor from './MessageEditor.svelte';
	import type { MessageInteraction } from '$lib/message';
	import { editing } from '$lib/stores/editing.svelte';

	let {
		message,
		index,
		loading,
		isFirst,
		isLast,
		interact
	}: {
		message: Message;
		index: number;
		loading: boolean;
		isFirst: boolean;
		isLast: boolean;
		interact?: MessageInteraction;
	} = $props();

	let messageCopy = $state<Message>(JSON.parse(JSON.stringify(message)));

	function startEditing() {
		messageCopy = $state.snapshot(message);
		editing.id = message.id;
	}

	function cancelEdit() {
		editing.id = '';
	}

	function stopEditing() {
		interact?.updateMessage(message, messageCopy.role, messageCopy.versions[messageCopy.index].content);
		editing.id = '';
	}

	type VariantDesign = {
		title: string;
		blockMargin: string;
		titlePosition: string;
		titleVariant: string;
		style: string;
	};
	const variants: Record<MessageRole, VariantDesign> = {
		system: {
			title: 'System',
			blockMargin: '',
			titlePosition: 'text-left',
			titleVariant: 'text-tertiary-300',
			style: 'variant-ghost-tertiary'
		},
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
		}
		// error: {
		// 	title: 'Error',
		// 	blockMargin: 'ml-auto',
		// 	titlePosition: 'text-right',
		// 	titleVariant: 'text-error-300',
		// 	style: 'variant-ghost-error'
		// }
	};
</script>

<div class="flex flex-row flex-nowrap">
	<div
		class="flex-grow flex-shrink-0 {message.role === 'system' ? 'w-full' : 'w-[75%] lg:max-w-[75%]'} {variants[
			message.role
		].blockMargin}"
	>
		<p class="text-xs opacity-75 {variants[message.role].titlePosition} {variants[message.role].titleVariant}">
			{variants[message.role].title}
		</p>
		<div class="card p-4 {variants[message.role].style} overflow-x-hidden">
			{#if editing.id === message.id}
				<MessageEditor bind:message={messageCopy} {index} />
			{:else}
				<MessageContent {message} />
			{/if}
			{#if interact}
				<div
					class="flex flex-col lg:flex-row gap-2 flex-grow flex-shrink items-end lg:items-center pt-2 justify-between transition-all"
					transition:slide={{ axis: 'y' }}
				>
					{#if message.versions.length > 1 && !editing.id}
						<div class="flex flex-row gap-2 items-center flex-grow flex-shrink">
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || message.index === 0}
								onclick={() => interact.previousVersion(message)}
							>
								<ChevronLeftIcon size={16} />
							</button>
							<span> {message.index + 1} / {message.versions.length}</span>
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || message.index >= message.versions.length - 1}
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
						{#if editing.id === message.id}
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
							{@const disabled = !!editing.id}
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || isFirst || disabled}
								onclick={() => interact.moveUp(message)}
							>
								<ArrowUpIcon size={16} />
							</button>
							<button
								type="button"
								class="btn btn-sm variant-soft-secondary transition-all disabled:opacity-75"
								disabled={loading || isLast || disabled}
								onclick={() => interact.moveDown(message)}
							>
								<ArrowDownIcon size={16} />
							</button>
							<button
								type="button"
								class="btn btn-sm variant-soft-tertiary transition-all disabled:opacity-75"
								disabled={loading || disabled}
								onclick={startEditing}
							>
								<PencilIcon size={16} />
							</button>
							{#if message.role === 'assistant'}
								<button
									type="button"
									class="btn btn-sm variant-soft-primary transition-all disabled:opacity-75"
									disabled={loading || disabled}
									onclick={() => interact.refresh(message)}
								>
									<RefreshCwIcon size={16} />
								</button>
							{/if}
							<button
								type="button"
								class="btn btn-sm variant-soft-error transition-all disabled:opacity-75"
								disabled={loading || disabled}
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
