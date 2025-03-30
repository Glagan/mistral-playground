<script lang="ts">
	import { getModalStore, type ModalComponent, type ModalSettings } from '@skeletonlabs/skeleton';
	import ExpandIcon from 'lucide-svelte/icons/expand';
	import FileTextIcon from 'lucide-svelte/icons/file-text';
	import Trash2Icon from 'lucide-svelte/icons/trash-2';
	import prettyBytes from 'pretty-bytes';
	import ImageModal from './ImageModal.svelte';
	import { onDestroy } from 'svelte';

	const {
		file,
		loading,
		remove
	}: {
		file: File;
		loading: boolean;
		remove: () => void;
	} = $props();

	const modalStore = getModalStore();

	const isImage = file.type.includes('image/');
	const imagePreview = URL.createObjectURL(file);

	function openExpandedView() {
		const modalComponent: ModalComponent = { ref: ImageModal };
		const expandedViewModal: ModalSettings = {
			type: 'component',
			backdropClasses: 'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
			component: modalComponent,
			image: imagePreview
		};
		modalStore.trigger(expandedViewModal);
	}

	onDestroy(() => {
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
		}
	});
</script>

<div class="flex flex-row gap-2 items-center dropzone textarea border border-surface-400 p-2 rounded-container-token">
	{#if isImage}
		<img src={URL.createObjectURL(file)} alt={file.name} class="w-32 h-32 object-cover" />
	{:else}
		<div class="flex-grow-0 flex-shrink-0">
			<FileTextIcon class="mx-auto" size="32" />
		</div>
	{/if}
	<div class="flex flex-col lg:flex-row flex-grow flex-shrink gap-2">
		<div class="flex flex-col flex-grow flex-shrink truncate">
			<div class="flex-grow flex-shrink truncate">{file.name}</div>
			<div class="text-sm text-surface-400">{prettyBytes(file.size)}</div>
		</div>
		<div class="flex flex-row items-center gap-2 flex-grow-0 flex-shrink-0">
			{#if isImage}
				<button type="button" class="btn btn-sm variant-ghost-primary" disabled={loading} onclick={openExpandedView}>
					<span>Expand</span>
					<ExpandIcon size={16} />
				</button>
			{/if}
			<div>
				<button type="button" class="btn variant-ghost-error" disabled={loading} onclick={remove}>
					<Trash2Icon size={16} />
				</button>
			</div>
		</div>
	</div>
</div>
