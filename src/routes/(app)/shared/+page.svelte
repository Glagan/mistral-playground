<script lang="ts">
	import ShareIcon from '@lucide/svelte/icons/share';
	import { liveQuery } from 'dexie';
	import { db, type ChatShareState } from '$lib/stores/db';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import LinkIcon from '@lucide/svelte/icons/link';
	import { joinURL } from 'ufo';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	let loading = $state(false);
	let sharedChats = liveQuery(() => db.share.reverse().toArray());

	async function copyShareLink(entry: ChatShareState) {
		await navigator.clipboard.writeText(joinURL(window.location.origin, 'share', entry.id));
		toast.success('Chat share link copied');
	}

	async function deleteChat(entry: ChatShareState) {
		loading = true;
		try {
			await fetch(`/api/share/${entry.id}?key=${entry.deletionKey}`, { method: 'DELETE' });
			toast.success('Chat share deleted');
			db.share.delete(entry.id);
		} catch (error) {
			console.error('Failed to delete chat share:', error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex max-h-[calc(100vh-88px)] shrink grow flex-col items-stretch gap-4 p-4 lg:max-h-screen">
	<h1 class="text-3xl">Shared chats</h1>
	{#if $sharedChats?.length}
		<div class="grid grid-cols-1 items-center gap-4 lg:grid-cols-3">
			{#each $sharedChats as share}
				<div class="card variant-ghost-primary flex flex-col gap-4 p-4">
					{#if share.title}
						<p class="line-clamp-3 whitespace-pre-wrap">{share.title}</p>
					{:else}
						<p class="text-neutral-200 italic">No title</p>
					{/if}
					<div class="border-primary-500 border-t border-dashed"></div>
					<div class="flex flex-row items-center justify-between gap-2">
						<p class="text-neutral-300">{new Date(share.createdAt).toLocaleString()}</p>
						<div>
							<button
								class="btn btn-sm variant-ringed-error shrink-0"
								disabled={loading}
								onclick={() => copyShareLink(share)}
							>
								<LinkIcon />
							</button>
							<ConfirmDialog
								title="Confirm deletion"
								description="Do you really want to delete this shared chat?"
								onConfirm={() => deleteChat(share)}
							>
								{#snippet trigger()}
									<button class="btn btn-sm variant-ringed-error shrink-0" disabled={loading}>
										<Trash2Icon />
									</button>
								{/snippet}
							</ConfirmDialog>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex shrink grow flex-col items-center justify-center gap-3 text-center">
			<ShareIcon size={52} />
			<h3 class="text-primary-500 text-xl">No shared chats</h3>
			<p>Chats you share will appear here.</p>
		</div>
	{/if}
</div>
