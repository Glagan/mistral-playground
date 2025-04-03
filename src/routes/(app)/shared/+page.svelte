<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import ShareIcon from 'lucide-svelte/icons/share';
	import { liveQuery } from 'dexie';
	import { db, type ChatShareState } from '$lib/stores/db';
	import Trash2Icon from 'lucide-svelte/icons/trash-2';
	import LinkIcon from 'lucide-svelte/icons/link';
	import { joinURL } from 'ufo';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let loading = $state(false);
	let sharedChats = liveQuery(() => db.share.toArray());

	async function copyShareLink(entry: ChatShareState) {
		await navigator.clipboard.writeText(joinURL(window.location.origin, 'share', entry.id));
		toastStore.trigger({
			classes: 'variant-filled-success',
			message: 'Chat share link copied'
		});
	}

	async function confirmDeletion(entry: ChatShareState) {
		modalStore.trigger({
			type: 'confirm',
			backdropClasses: 'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
			title: 'Confirm',
			body: 'Do you really want to delete this shared chat?',
			response: async (r: boolean) => {
				if (r) {
					loading = true;
					try {
						await fetch(`/api/share/${entry.id}?key=${entry.deletionKey}`, { method: 'DELETE' });
						toastStore.trigger({
							classes: 'variant-filled-success',
							message: 'Chat share deleted'
						});
						db.share.delete(entry.id);
					} catch (error) {
						console.error('Failed to delete chat share:', error);
					} finally {
						loading = false;
					}
				}
			}
		});
	}
</script>

<div class="flex flex-grow flex-shrink items-stretch flex-col gap-4 p-4 max-h-[calc(100vh-88px)] lg:max-h-screen">
	<h1 class="text-3xl">Shared chats</h1>
	{#if $sharedChats?.length}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
			{#each $sharedChats as share}
				<div class="card flex flex-col gap-4 p-4 variant-ghost-primary">
					{#if share.title}
						<p class="line-clamp-3 whitespace-pre-wrap">{share.title}</p>
					{:else}
						<p class="text-neutral-200 italic">No title</p>
					{/if}
					<div class="border-t border-primary-500 border-dashed"></div>
					<div class="flex flex-row gap-2 justify-between items-center">
						<p class="text-neutral-300">{new Date(share.createdAt).toLocaleString()}</p>
						<div>
							<button
								class="flex-shrink-0 btn btn-sm variant-ringed-error"
								disabled={loading}
								onclick={() => copyShareLink(share)}
							>
								<LinkIcon />
							</button>
							<button
								class="flex-shrink-0 btn btn-sm variant-ringed-error"
								disabled={loading}
								onclick={() => confirmDeletion(share)}
							>
								<Trash2Icon />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center flex-grow flex-shrink text-center gap-3">
			<ShareIcon size={52} />
			<h3 class="text-xl text-primary-500">No shared chats</h3>
			<p>Chats you share will appear here.</p>
		</div>
	{/if}
</div>
