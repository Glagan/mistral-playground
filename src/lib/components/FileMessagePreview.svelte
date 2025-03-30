<script lang="ts">
	import { getModalStore, type ModalComponent, type ModalSettings } from '@skeletonlabs/skeleton';
	import ExpandIcon from 'lucide-svelte/icons/expand';
	import FileTextIcon from 'lucide-svelte/icons/file-text';
	import Trash2Icon from 'lucide-svelte/icons/trash-2';
	import ImageModal from './ImageModal.svelte';
	import type { DocumentURLChunk, ImageURLChunk } from '@mistralai/mistralai/models/components';

	const {
		chunk,
		remove
	}: {
		chunk: ImageURLChunk | DocumentURLChunk;
		remove?: () => void;
	} = $props();

	const modalStore = getModalStore();

	const isImage = chunk.type === 'image_url';

	function openExpandedView() {
		if (isImage) {
			const modalComponent: ModalComponent = { ref: ImageModal };
			const expandedViewModal: ModalSettings = {
				type: 'component',
				backdropClasses: 'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
				component: modalComponent,
				image: typeof chunk.imageUrl === 'string' ? chunk.imageUrl : chunk.imageUrl.url
			};
			modalStore.trigger(expandedViewModal);
		}
	}
</script>

<div class="flex flex-row gap-2 items-center dropzone textarea border border-surface-400 p-2 rounded-container-token">
	{#if isImage}
		<img
			src={typeof chunk.imageUrl === 'string' ? chunk.imageUrl : chunk.imageUrl.url}
			alt={typeof chunk.imageUrl === 'string' ? 'Image' : (chunk.imageUrl.detail ?? 'Image')}
			class="w-32 h-32 object-cover"
		/>
	{:else}
		<div class="flex-grow-0 flex-shrink-0">
			<FileTextIcon class="mx-auto" size="32" />
		</div>
	{/if}
	{#if chunk.type === 'image_url' && typeof chunk.imageUrl !== 'string' && chunk.imageUrl.detail}
		<div class="flex flex-col flex-grow flex-shrink truncate">
			<div class="flex-grow flex-shrink truncate">{chunk.imageUrl.detail}</div>
		</div>
	{:else if chunk.type === 'document_url' && chunk.documentName}
		<div class="flex flex-col flex-grow flex-shrink truncate">
			<div class="flex-grow flex-shrink truncate">{chunk.documentName}</div>
		</div>
	{:else}
		<div class="flex-grow flex-shrink"></div>
	{/if}
	{#if isImage}
		<button type="reset" class="btn btn-sm variant-ghost-primary" onclick={openExpandedView}>
			<span>Expand</span>
			<ExpandIcon size={16} />
		</button>
	{/if}
	{#if remove}
		<div>
			<button type="reset" class="btn variant-ghost-error" onclick={remove}>
				<Trash2Icon size={16} />
			</button>
		</div>
	{/if}
</div>
