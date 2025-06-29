<script lang="ts">
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import prettyBytes from 'pretty-bytes';
	import ImageModal from './ImageModal.svelte';
	import { onDestroy } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';

	const {
		file,
		loading,
		remove
	}: {
		file: File;
		loading: boolean;
		remove: () => void;
	} = $props();

	const isImage = file.type.includes('image/');
	const imagePreview = URL.createObjectURL(file);

	onDestroy(() => {
		if (imagePreview) {
			URL.revokeObjectURL(imagePreview);
		}
	});
</script>

<Card.Root class="py-2">
	<Card.Header class="px-2">
		<Card.Title>{file.name}</Card.Title>
		<Card.Description>{prettyBytes(file.size)}</Card.Description>
	</Card.Header>
	<Card.Content class="flex items-center justify-center px-2">
		{#if isImage}
			<img src={URL.createObjectURL(file)} alt={file.name} class="h-32 w-32 object-cover" />
		{:else}
			<div class="shrink-0 grow-0">
				<FileTextIcon class="mx-auto" size="32" />
			</div>
		{/if}
	</Card.Content>
	<Card.Footer class="flex-row justify-end gap-2 px-2">
		{#if isImage}
			<ImageModal image={imagePreview} title={file.name} />
		{/if}
		<div>
			<Button variant="destructive" disabled={loading} onclick={remove}>
				<Trash2Icon size={16} />
			</Button>
		</div>
	</Card.Footer>
</Card.Root>
