<script lang="ts">
	import type { Message } from '$lib/types';
	import { onMount, tick } from 'svelte';
	import FileMessagePreview from '$lib/components/File/MessagePreview.svelte';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import InfoIcon from '@lucide/svelte/icons/info';
	import { chat } from '$lib/stores/chat.svelte';

	let {
		message = $bindable(),
		index
	}: {
		message: Message;
		index: number;
	} = $props();

	let textarea: Record<string, HTMLTextAreaElement | null> = $state({});
	for (let index = 0; index < message.versions.length; index++) {
		textarea[index] = null;
	}

	// Lock the message type switch if there is any files in the current message
	// -- only "user" messages can have files
	const hasAnyFile = $derived(
		!!message.versions.find((version) => {
			return (
				Array.isArray(version.content) &&
				version.content.some((item) => item.type === 'image_url' || item.type === 'document_url')
			);
		})
	);

	onMount(() => {
		tick().then(() => {
			const keys = Object.keys(textarea);
			if (keys.length && textarea[keys[0]]) {
				textarea[keys[0]]!.focus();
				textarea[keys[0]]!.selectionStart = textarea[keys[0]]!.value.length;
			}
		});
	});
</script>

<div class="mb-2 flex flex-row items-center gap-2">
	<ToggleGroup.Root bind:value={message.role} variant="outline" type="single">
		<ToggleGroup.Item value="user" disabled={hasAnyFile} class="w-24">User</ToggleGroup.Item>
		<ToggleGroup.Item value="assistant" disabled={hasAnyFile} class="w-24">Assistant</ToggleGroup.Item>
	</ToggleGroup.Root>
	{#if hasAnyFile}
		<Alert.Root>
			<InfoIcon />
			<Alert.Title>Delete the files to change the message type.</Alert.Title>
		</Alert.Root>
	{/if}
</div>
<div class="space-y-2">
	{#if chat.isThinking && message.role === 'assistant'}
		<label for="message-{message.id}-thoughts" class="text-sm leading-none font-medium">Assistant thoughts</label>
		<Textarea
			id="message-{message.id}-thoughts"
			rows={5}
			placeholder="Thoughts of the assistant..."
			bind:value={message.versions[message.index].thinking}
		/>
		<label for="message-{message.id}-content" class="text-sm leading-none font-medium">Assistant response</label>
	{/if}
	{#each message.versions[message.index].content as item, index}
		{#if item.type === 'text'}
			<Textarea
				id="message-{message.id}-content"
				bind:ref={textarea[index]}
				rows={5}
				placeholder="Type something or drag and drop images..."
				bind:value={item.text}
			/>
		{:else if item.type === 'image_url' || item.type === 'document_url'}
			<FileMessagePreview chunk={item} remove={() => message.versions[message.index].content.splice(index, 1)} />
		{/if}
	{/each}
</div>
