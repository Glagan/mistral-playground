<script lang="ts">
	import ShareIcon from '@lucide/svelte/icons/share';
	import { liveQuery } from 'dexie';
	import { db, type ChatShareState } from '$lib/stores/db';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import LinkIcon from '@lucide/svelte/icons/link';
	import { joinURL } from 'ufo';
	import { toast } from 'svelte-sonner';
	import ConfirmDialog from '$lib/components/Dialog/ConfirmDialog.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';

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

<div class="flex max-h-[calc(100vh-88px)] shrink grow flex-col items-stretch gap-4 lg:max-h-screen">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Shared chats</h1>
	{#if $sharedChats?.length}
		<div class="grid grid-cols-1 items-center gap-4 lg:grid-cols-4">
			{#each $sharedChats as share}
				<Card.Root class="w-full ">
					<Card.Header>
						{#if share.title}
							<Card.Title>{share.title}</Card.Title>
						{/if}
						<Card.Description>{new Date(share.createdAt).toLocaleString()}</Card.Description>
					</Card.Header>
					<Card.Footer class="flex flex-row justify-end gap-2">
						<Button onclick={() => copyShareLink(share)}>
							<LinkIcon />
						</Button>
						<ConfirmDialog
							title="Confirm deletion"
							description="Do you really want to delete this shared chat?"
							onConfirm={() => deleteChat(share)}
						>
							{#snippet trigger()}
								<Button variant="destructive" disabled={loading}>
									<Trash2Icon />
								</Button>
							{/snippet}
						</ConfirmDialog>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{:else}
		<div class="flex shrink grow flex-col items-center justify-center gap-3 text-center">
			<ShareIcon size={52} />
			<h3 class=" text-2xl font-semibold tracking-tight">No shared chats</h3>
			<p class="text-muted-foreground leading-7">You can manage your shared chats from here.</p>
		</div>
	{/if}
</div>
