<script lang="ts">
	import { onMount } from 'svelte';
	import { loadModels } from '$lib/stores/models.svelte';
	import type { PageProps } from './$types';
	import { error } from '@sveltejs/kit';
	import { joinURL } from 'ufo';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Messages from '$lib/components/Chat/Messages.svelte';
	import MessageCircleQuestionIcon from '@lucide/svelte/icons/message-circle-question';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import BotIcon from '@lucide/svelte/icons/bot';
	import LinkIcon from '@lucide/svelte/icons/link';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/Dialog/ConfirmDialog.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let { data }: PageProps = $props();
	let chat = data.chat;
	const chatError = null;

	if (!data) {
		error(400, 'Invalid shared link');
	}

	// Get the delete key from the URL query
	const deleteKey = $state(page.url.searchParams.get('key'));

	async function copyShareLink() {
		await navigator.clipboard.writeText(joinURL(window.location.origin, window.location.pathname));
		toast.success('Chat share link copied');
	}

	async function deleteChat() {
		await fetch(`/api/share/${page.params.uuid}?key=${deleteKey}`, { method: 'DELETE' });
		toast.success('Shared chat deleted');
		goto('/');
	}

	onMount(() => {
		loadModels();
	});
</script>

<svelte:head>
	<title>Mistral Playground :: Shared chat</title>
</svelte:head>

<div
	class="mx-auto flex max-h-[calc(100vh-80px)] shrink grow flex-col items-stretch justify-center gap-4 p-4 lg:w-[50vw]"
>
	{#if chat}
		<div class="relative w-full shrink grow overflow-auto">
			{#if chat}
				<Messages messages={chat.data.messages} loading={false} error={chatError} />
			{/if}
			<div class="from-surface-900/0 to-surface-900 sticky right-0 bottom-0 left-0 h-4 bg-gradient-to-b"></div>
		</div>
		<Alert.Root>
			<MessageCircleQuestionIcon size={24} />
			<Alert.Title>Shared chat</Alert.Title>
			<Alert.Description>
				<p>
					This chat was generated using the <a href="https://mistral.ai/" target="_blank" class="underline">Mistral</a>
					model
					<b>{chat.data.options.model}</b>.
				</p>
				<p>Be aware that this text could have been altered and not be the exact output of the model.</p>
			</Alert.Description>
		</Alert.Root>
	{:else}
		<div class="flex flex-col items-center gap-3 text-center">
			<TriangleAlertIcon size={52} />
			<h3 class="text-xl text-red-500">Failed to load shared chat</h3>
			<p>The chat data is corrupted or doesn't exists.</p>
			<div class="flex flex-row items-center gap-2">
				<a href="/" class="btn variant-ringed-primary justify-start font-bold transition-all disabled:opacity-75">
					<BotIcon class="shrink-0" />
					<span class="truncate">Go back home</span>
				</a>
			</div>
		</div>
	{/if}
	{#if chat}
		<div class="flex flex-row items-center justify-center gap-4 p-2">
			<Button onclick={copyShareLink}>
				<LinkIcon size={24} />
				<span>Copy link</span>
			</Button>
			{#if deleteKey}
				<ConfirmDialog
					title="Confirm deletion"
					description="Do you really want to delete this shared chat?"
					onConfirm={deleteChat}
				>
					{#snippet trigger()}
						<Button variant="destructive">
							<Trash2Icon size={24} />
							<span>Delete</span>
						</Button>
					{/snippet}
				</ConfirmDialog>
			{/if}
		</div>
	{/if}
</div>
