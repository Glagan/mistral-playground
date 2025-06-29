<script lang="ts">
	import { onMount } from 'svelte';
	import { loadModels } from '$lib/stores/models.svelte';
	import type { PageProps } from './$types';
	import { error } from '@sveltejs/kit';
	import { joinURL } from 'ufo';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Messages from '$lib/components/Messages.svelte';
	import MessageCircleQuestionIcon from '@lucide/svelte/icons/message-circle-question';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import BotIcon from '@lucide/svelte/icons/bot';
	import LinkIcon from '@lucide/svelte/icons/link';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

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
		toast.success('Chat share deleted');
		goto('/');
	}

	onMount(() => {
		loadModels();
	});
</script>

<div class="flex max-h-[calc(100vh-88px)] shrink grow flex-col items-stretch justify-center gap-4 p-4 lg:max-h-screen">
	{#if chat}
		<div class="relative w-full shrink grow overflow-auto">
			{#if chat}
				<Messages messages={chat.data.messages} loading={false} error={chatError} />
			{/if}
			<div class="from-surface-900/0 to-surface-900 sticky right-0 bottom-0 left-0 h-4 bg-gradient-to-b"></div>
		</div>
		<div class="alert variant-ghost-tertiary flex-row items-center gap-3 p-2 text-sm lg:p-4">
			<div>
				<MessageCircleQuestionIcon size={24} />
			</div>
			<div class="alert-message !mt-0">
				<h3 class="text-base">Shared chat</h3>
				<p>
					This chat was generated using the <a href="https://mistral.ai/" target="_blank" class="underline">Mistral</a>
					model
					<b>{chat.data.options.model}</b>.
				</p>
				<p>Be aware that this text could have been altered and not be the exact output of the model.</p>
			</div>
		</div>
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
</div>
<div class="flex flex-row items-center justify-center gap-4 p-4 lg:flex-col lg:justify-start">
	{#if chat}
		<button type="button" class="btn variant-ghost-primary shrink-0" onclick={copyShareLink}>
			<LinkIcon size={24} />
			<span>Copy link</span>
		</button>
		{#if deleteKey}
			<ConfirmDialog
				title="Confirm deletion"
				description="Do you really want to delete this shared chat?"
				onConfirm={deleteChat}
			>
				{#snippet trigger()}
					<button type="button" class="btn variant-ghost-error shrink-0">
						<Trash2Icon size={24} />
						<span>Delete</span>
					</button>
				{/snippet}
			</ConfirmDialog>
		{/if}
	{/if}
</div>
