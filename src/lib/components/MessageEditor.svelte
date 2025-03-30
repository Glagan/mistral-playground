<script lang="ts">
	import type { Message } from '$lib/types';
	import { onMount, tick } from 'svelte';
	import FileMessagePreview from './FileMessagePreview.svelte';
	import { FileDropzone, getToastStore, RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
	import ImageIcon from 'lucide-svelte/icons/image';
	import type { ContentChunk } from '@mistralai/mistralai/models/components';
	import { fileToB64, handleFileUpload } from '$lib/files';

	let {
		message = $bindable(),
		index
	}: {
		message: Message;
		index: number;
	} = $props();

	let textarea: Record<string, HTMLTextAreaElement> = $state({});
	const toastStore = getToastStore();

	// Lock the message type switch if there is any files in the current message
	// -- only "user" messages can have files
	const hasAnyFile = $derived(
		message.versions.find((version) => {
			return (
				Array.isArray(version.content) &&
				version.content.some((item) => item.type === 'image_url' || item.type === 'document_url')
			);
		})
	);

	async function onFileChange(rawEvent: Event) {
		const event = rawEvent as Event & {
			target: EventTarget & HTMLInputElement;
		};
		const files = event.target.files ? Array.from(event.target.files) : [];
		const { files: validFiles, errors } = handleFileUpload(files);
		for (const error of errors) {
			toastStore.trigger({ message: error, background: 'variant-filled-warning' });
		}
		if (validFiles.length) {
			for (let index = 0; index < validFiles.length; index++) {
				const file = validFiles[index];
				if (file.type.includes('image/')) {
					(message.versions[message.index].content as ContentChunk[]).push({
						type: 'image_url' as const,
						imageUrl: await fileToB64(file)
					});
				} else {
					(message.versions[message.index].content as ContentChunk[]).push({
						type: 'document_url' as const,
						documentUrl: await fileToB64(file),
						documentName: file.name
					});
				}
			}
			event.target.files = null;
		}
	}

	onMount(() => {
		tick().then(() => {
			const keys = Object.keys(textarea);
			if (keys.length) {
				textarea[keys[0]].focus();
				textarea[keys[0]].selectionStart = textarea[keys[0]].value.length;
			}
		});
	});
</script>

<div class="flex flex-row items-center gap-2 mb-2">
	<RadioGroup>
		<RadioItem bind:group={message.role} name="justify" value="system" disabled={hasAnyFile || index > 0}>
			System
		</RadioItem>
		<RadioItem bind:group={message.role} name="justify" value="user" disabled={hasAnyFile}>User</RadioItem>
		<RadioItem bind:group={message.role} name="justify" value="assistant" disabled={hasAnyFile}>Assistant</RadioItem>
	</RadioGroup>
	{#if hasAnyFile}
		<aside class="alert variant-filled-surface p-2">
			<div class="alert-message">Delete the files to change the message type.</div>
		</aside>
	{/if}
</div>
<div class="space-y-2">
	{#each message.versions[message.index].content as item, index}
		{#if item.type === 'text'}
			<textarea bind:this={textarea[0]} bind:value={item.text} class="textarea w-full" rows="10"></textarea>
		{:else if item.type === 'image_url' || item.type === 'document_url'}
			<FileMessagePreview chunk={item} remove={() => message.versions[message.index].content.splice(index, 1)} />
		{/if}
	{/each}
	{#if message.role === 'user'}
		<FileDropzone
			name="files"
			accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
			on:change={onFileChange}
		>
			<svelte:fragment slot="lead">
				<ImageIcon class="mx-auto" size="32" />
			</svelte:fragment>
			<svelte:fragment slot="message">
				<span class="label-text"><strong>Upload a file</strong> or drag and drop</span>
			</svelte:fragment>
			<svelte:fragment slot="meta">
				<span>Images (.png, .jpeg, .jpg and .webp) allowed.</span>
			</svelte:fragment>
		</FileDropzone>
	{/if}
</div>
