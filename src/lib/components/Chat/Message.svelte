<script lang="ts">
	import type { Message, MessageRole } from '$lib/types';
	import { slide } from 'svelte/transition';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import MessageContent from './MessageContent.svelte';
	import MessageEditor from './MessageEditor.svelte';
	import type { MessageInteraction } from '$lib/message';
	import { editing } from '$lib/stores/editing.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import FileUpIcon from '@lucide/svelte/icons/file-up';
	import { models } from '$lib/stores/models.svelte';
	import type { ContentChunk } from '@mistralai/mistralai/models/components';
	import { fileToB64, handleFileUpload, mimeTypesAccept } from '$lib/files';
	import { toast } from 'svelte-sonner';
	import { chat } from '$lib/stores/chat.svelte';

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
		interact?.updateMessage(
			message,
			messageCopy.role,
			messageCopy.versions[messageCopy.index].content,
			messageCopy.role === 'assistant' ? messageCopy.versions[messageCopy.index].thinking : undefined
		);
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
			titleVariant: 'text-amber-600',
			style: 'border-amber-800 bg-amber-600/10'
		},
		user: {
			title: 'User',
			blockMargin: '',
			titlePosition: 'text-left',
			titleVariant: 'text-emerald-600',
			style: 'border-emerald-800 bg-emerald-600/10'
		},
		assistant: {
			title: 'Assistant',
			blockMargin: 'ml-auto',
			titlePosition: 'text-right',
			titleVariant: 'text-sky-600',
			style: 'border-sky-800 bg-sky-600/10'
		}
		// error: {
		// 	title: 'Error',
		// 	blockMargin: 'ml-auto',
		// 	titlePosition: 'text-right',
		// 	titleVariant: 'text-error-300',
		// 	style: 'variant-ghost-error'
		// }
	};

	async function onUpload(uploadedFiles: FileList | null) {
		if (!uploadedFiles) {
			return;
		}
		// we use set instead of an assignment since it accepts a File[]
		const { files: validFiles, errors } = handleFileUpload(Array.from(uploadedFiles));
		for (const error of errors) {
			toast.error(error);
		}
		if (validFiles.length) {
			for (let index = 0; index < validFiles.length; index++) {
				const file = validFiles[index];
				if (file.type.includes('image/')) {
					(messageCopy.versions[messageCopy.index].content as ContentChunk[]).push({
						type: 'image_url' as const,
						imageUrl: await fileToB64(file)
					});
				} else {
					(messageCopy.versions[messageCopy.index].content as ContentChunk[]).push({
						type: 'document_url' as const,
						documentUrl: await fileToB64(file),
						documentName: file.name
					});
				}
			}
		}
	}
</script>

<Card.Root
	class="py-3 {message.role === 'system' ? 'w-full' : 'w-[75%] lg:max-w-[75%]'} {variants[message.role]
		.blockMargin} {variants[message.role].style} gap-3"
>
	{#if editing.id !== message.id}
		<Card.Header class="px-3">
			<Card.Title class={variants[message.role].titleVariant}>{variants[message.role].title}</Card.Title>
		</Card.Header>
	{/if}
	<Card.Content class="relative px-3">
		{#if editing.id === message.id}
			<MessageEditor bind:message={messageCopy} {index} />
		{:else}
			<MessageContent {message} />
		{/if}
	</Card.Content>
	{#if interact}
		<Card.Footer
			class="flex shrink grow flex-col items-end justify-between gap-2 px-3 transition-all lg:flex-row lg:items-center"
		>
			{#if message.versions.length > 1 && !editing.id}
				<div class="flex shrink grow flex-row items-center gap-2">
					<Button
						variant="secondary"
						disabled={loading || message.index === 0}
						onclick={() => interact.previousVersion(message)}
					>
						<ChevronLeftIcon size={16} />
					</Button>
					<span> {message.index + 1} / {message.versions.length}</span>
					<Button
						variant="secondary"
						disabled={loading || message.index >= message.versions.length - 1}
						onclick={() => interact.nextVersion(message)}
					>
						<ChevronRightIcon size={16} />
					</Button>
					<Button variant="destructive" disabled={loading} onclick={() => interact.deleteVersion(message)}>
						<Trash2Icon size={16} />
					</Button>
				</div>
			{:else if editing.id !== message.id}
				<div class="shrink grow"></div>
			{/if}
			<div class="flex shrink-0 flex-row flex-wrap items-center gap-2 {editing.id === message.id ? 'w-full' : ''}">
				{#if editing.id === message.id}
					{#if chat.model.capabilities.vision}
						<label for="messageFileUpload">
							<input
								id="messageFileUpload"
								type="file"
								multiple
								accept={mimeTypesAccept}
								onchange={(e) => onUpload(e.currentTarget.files)}
								class="hidden"
							/>
							<Button
								variant="secondary"
								disabled={loading || models.loading || !!models.error || message.role !== 'user'}
								onclick={() => document.getElementById('messageFileUpload')?.click()}
							>
								<FileUpIcon size={20} />
								<span class="hidden md:inline-block">Upload file</span>
							</Button>
						</label>
					{/if}
					<span class="shrink grow"></span>
					<Button variant="destructive" disabled={loading} onclick={cancelEdit}>Cancel</Button>
					<Button disabled={loading} onclick={stopEditing}>Save</Button>
				{:else}
					{@const disabled = !!editing.id}
					<Button
						variant="secondary"
						disabled={loading || isFirst || disabled}
						onclick={() => interact.moveUp(message)}
					>
						<ArrowUpIcon size={16} />
					</Button>
					<Button
						variant="secondary"
						disabled={loading || isLast || disabled}
						onclick={() => interact.moveDown(message)}
					>
						<ArrowDownIcon size={16} />
					</Button>
					<Button variant="secondary" disabled={loading || disabled} onclick={startEditing}>
						<PencilIcon size={16} />
					</Button>
					{#if message.role === 'assistant'}
						<Button disabled={loading || disabled} onclick={() => interact.refresh(message)}>
							<RefreshCwIcon size={16} />
						</Button>
					{/if}
					<Button variant="destructive" disabled={loading || disabled} onclick={() => interact.deleteMessage(message)}>
						<Trash2Icon size={16} />
					</Button>
				{/if}
			</div>
		</Card.Footer>
	{/if}
</Card.Root>
