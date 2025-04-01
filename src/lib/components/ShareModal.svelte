<script lang="ts">
	import { joinURL } from 'ufo';
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import LinkIcon from 'lucide-svelte/icons/link';
	import KeyRoundIcon from 'lucide-svelte/icons/key-round';
	import { chat } from '$lib/stores/chat.svelte';
	import type { SelectChatShare } from '$lib/server/schema';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	let loading = $state(false);
	let shareId = $state('');
	let deletionKey = $state('');

	async function generate() {
		loading = true;
		const response = await fetch('/api/share', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(chat.state)
		});
		const body = (await response.json()) as { chatShare: SelectChatShare };
		const link = `${joinURL(window.location.host, 'share', body.chatShare.id)}?key=${body.chatShare.deletionKey}`;
		shareId = body.chatShare.id;
		deletionKey = body.chatShare.deletionKey;
		toastStore.trigger({
			classes: 'variant-filled-success',
			message: 'Chat share link created'
		});
		loading = false;
	}

	async function copyShareLink(includeDeletion = false) {
		await navigator.clipboard.writeText(
			includeDeletion
				? `${joinURL(window.location.host, 'share', shareId)}?key=${deletionKey}`
				: `${joinURL(window.location.host, 'share', shareId)}`
		);
		toastStore.trigger({
			classes: 'variant-filled-success',
			message: 'Chat share link copied'
		});
	}

	async function copyDeletionKey() {
		await navigator.clipboard.writeText(deletionKey);
		toastStore.trigger({
			classes: 'variant-filled-success',
			message: 'Deletion key copied'
		});
	}
</script>

{#if $modalStore[0]}
	<div>
		<h2 class="text-xl">Share</h2>
		<div class="card variant-filled-surface p-4 flex flex-col gap-4">
			<div>The created Shared link is public and can't be deleted without it's key.</div>
			<div>Your API key is safe and <b>not</b> included in the share link.</div>
			{#if shareId}
				<div>
					<p>Chat share link</p>
					<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
						<div class="input-group-shim">
							<LinkIcon size={24} />
						</div>
						<input
							type="text"
							value={joinURL(window.location.host, 'share', shareId)}
							readonly
							placeholder="Chat share link"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-2 items-center">
					<button type="button" onclick={() => copyShareLink} class="btn variant-ghost-secondary">Copy</button>
					<button type="button" onclick={() => copyShareLink(true)} class="btn variant-ghost-success"
						>Copy with deletion key</button
					>
				</div>
			{/if}
			{#if deletionKey}
				<div>
					<p>Deletion key</p>
					<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
						<div class="input-group-shim">
							<KeyRoundIcon size={24} />
						</div>
						<input type="text" value={deletionKey} readonly placeholder="Deletion key" />
						<button type="button" onclick={copyDeletionKey} class="variant-filled-success">Copy</button>
					</div>
				</div>
			{/if}
		</div>
		<div class="flex items-center justify-end gap-4 mt-2">
			<button
				type="button"
				class="flex-shrink-0 btn variant-ghost-primary"
				disabled={loading}
				onclick={() => modalStore.close()}
			>
				Close
			</button>
			{#if !shareId}
				<button
					type="submit"
					class="flex-shrink-0 btn variant-filled-success"
					disabled={loading}
					onclick={() => generate()}
				>
					Create
				</button>
			{/if}
		</div>
	</div>
{/if}
