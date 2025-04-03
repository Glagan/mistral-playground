<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { loadModels } from '$lib/stores/models.svelte';
	import type { PageProps } from './$types';
	import { error } from '@sveltejs/kit';
	import { joinURL } from 'ufo';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Messages from '$lib/components/Messages.svelte';
	import MessageCircleQuestionIcon from 'lucide-svelte/icons/message-circle-question';
	import TriangleAlertIcon from 'lucide-svelte/icons/triangle-alert';
	import BotIcon from 'lucide-svelte/icons/bot';
	import LinkIcon from 'lucide-svelte/icons/link';
	import Trash2Icon from 'lucide-svelte/icons/trash-2';

	let { data }: PageProps = $props();
	let chat = data.chat;
	const chatError = null;

	if (!data) {
		error(400, 'Invalid shared link');
	}

	const modalStore = getModalStore();
	const toastStore = getToastStore();
	// Get the delete key from the URL query
	const deleteKey = $state(page.url.searchParams.get('key'));

	async function copyShareLink() {
		await navigator.clipboard.writeText(joinURL(window.location.origin, window.location.pathname));
		toastStore.trigger({
			classes: 'variant-filled-success',
			message: 'Chat share link copied'
		});
	}

	async function confirmDeletion() {
		modalStore.trigger({
			type: 'confirm',
			backdropClasses: 'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
			title: 'Confirm',
			body: 'Do you really want to delete this shared chat?',
			response: async (r: boolean) => {
				if (r) {
					await fetch(`/api/share/${page.params.uuid}?key=${deleteKey}`, { method: 'DELETE' });
					toastStore.trigger({
						classes: 'variant-filled-success',
						message: 'Chat share deleted'
					});
					goto('/');
				}
			}
		});
	}

	onMount(() => {
		loadModels();
	});
</script>

<div
	class="flex flex-grow flex-shrink justify-center items-stretch flex-col gap-4 p-4 max-h-[calc(100vh-88px)] lg:max-h-screen"
>
	{#if chat}
		<div class="relative flex-grow flex-shrink w-full overflow-auto">
			{#if chat}
				<Messages messages={chat.data.messages} loading={false} error={chatError} />
			{/if}
			<div class="h-4 bg-gradient-to-b from-surface-900/0 to-surface-900 sticky bottom-0 left-0 right-0"></div>
		</div>
		<div class="alert flex-row items-center gap-3 variant-ghost-tertiary text-sm p-2 lg:p-4">
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
		<div class="flex flex-col items-center text-center gap-3">
			<TriangleAlertIcon size={52} />
			<h3 class="text-xl text-red-500">Failed to load shared chat</h3>
			<p>The chat data is corrupted or doesn't exists.</p>
			<div class="flex flex-row gap-2 items-center">
				<a href="/" class="btn justify-start font-bold transition-all variant-ringed-primary disabled:opacity-75">
					<BotIcon class="flex-shrink-0" />
					<span class="truncate">Go back home</span>
				</a>
			</div>
		</div>
	{/if}
</div>
<div class="flex flex-row lg:flex-col justify-center lg:justify-start items-center p-4 gap-4">
	{#if chat}
		<button type="button" class="flex-shrink-0 btn variant-ghost-primary" onclick={copyShareLink}>
			<LinkIcon size={24} />
			<span>Copy link</span>
		</button>
		{#if deleteKey}
			<button type="button" class="flex-shrink-0 btn variant-ghost-error" onclick={confirmDeletion}>
				<Trash2Icon size={24} />
				<span>Delete</span>
			</button>
		{/if}
	{/if}
</div>
