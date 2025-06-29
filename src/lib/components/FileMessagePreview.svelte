<script lang="ts">
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ImageModal from './ImageModal.svelte';
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

<Card.Root class="py-2">
	{#if (chunk.type === 'image_url' && typeof chunk.imageUrl !== 'string' && chunk.imageUrl.detail) || (chunk.type === 'document_url' && chunk.documentName)}
		<Card.Header class="px-2">
			<Card.Title>
				{#if chunk.type === 'image_url' && typeof chunk.imageUrl !== 'string' && chunk.imageUrl.detail}
					{chunk.imageUrl.detail}
				{:else if chunk.type === 'document_url' && chunk.documentName}
					{chunk.documentName}
				{/if}
			</Card.Title>
		</Card.Header>
	{/if}
	<Card.Content class="flex items-center justify-between px-2">
		{#if isImage}
			<img
				src={typeof chunk.imageUrl === 'string' ? chunk.imageUrl : chunk.imageUrl.url}
				alt={typeof chunk.imageUrl === 'string' ? 'Image' : (chunk.imageUrl.detail ?? 'Image')}
				class="h-32 w-32 object-cover"
			/>
		{:else}
			<div class="shrink-0 grow-0">
				<FileTextIcon class="mx-auto" size="32" />
			</div>
		{/if}
		<div class="flex flex-row gap-1.5">
			{#if isImage}
				<ImageModal
					image={typeof chunk.imageUrl === 'string' ? chunk.imageUrl : chunk.imageUrl.url}
					title={typeof chunk.imageUrl === 'string' ? 'Image' : (chunk.imageUrl.detail ?? 'Image')}
				/>
			{/if}
			{#if remove}
				<div>
					<Button variant="destructive" onclick={remove}>
						<Trash2Icon size={16} />
					</Button>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
