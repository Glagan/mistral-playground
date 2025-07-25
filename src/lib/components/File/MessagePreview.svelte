<script lang="ts">
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ImageModal from '$lib/components/Dialog/ImageModal.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { DocumentURLChunk, ImageURLChunk } from '@mistralai/mistralai/models/components';

	const {
		chunk,
		remove
	}: {
		chunk: ImageURLChunk | DocumentURLChunk;
		remove?: () => void;
	} = $props();

	const isImage = chunk.type === 'image_url';
</script>

<Card.Root class="gap-2 py-2">
	{#if (chunk.type === 'image_url' && typeof chunk.imageUrl !== 'string' && chunk.imageUrl.detail) || (chunk.type === 'document_url' && chunk.documentName)}
		<Card.Header class="block px-2">
			<Card.Title class="flex flex-row flex-wrap items-center justify-between gap-2">
				<span class="flex grow flex-row flex-wrap items-center gap-2">
					{#if chunk.type === 'image_url' && typeof chunk.imageUrl !== 'string' && chunk.imageUrl.detail}
						{chunk.imageUrl.detail}
					{:else if chunk.type === 'document_url' && chunk.documentName}
						<FileTextIcon size="24" /> {chunk.documentName}
					{/if}
				</span>
				{#if !isImage && remove}
					<Button variant="destructive" onclick={remove}>
						<Trash2Icon size={16} />
					</Button>
				{/if}
			</Card.Title>
		</Card.Header>
	{/if}
	{#if isImage}
		<Card.Content class="flex items-center justify-between px-2">
			{#if isImage}
				<img
					src={typeof chunk.imageUrl === 'string' ? chunk.imageUrl : chunk.imageUrl.url}
					alt={typeof chunk.imageUrl === 'string' ? 'Image' : (chunk.imageUrl.detail ?? 'Image')}
					class="h-32 w-32 object-cover"
				/>
			{/if}
			<div class="flex flex-row gap-1.5">
				<ImageModal
					image={typeof chunk.imageUrl === 'string' ? chunk.imageUrl : chunk.imageUrl.url}
					title={typeof chunk.imageUrl === 'string' ? 'Image' : (chunk.imageUrl.detail ?? 'Image')}
				/>
				{#if remove}
					<div>
						<Button variant="destructive" onclick={remove}>
							<Trash2Icon size={16} />
						</Button>
					</div>
				{/if}
			</div>
		</Card.Content>
	{/if}
</Card.Root>
