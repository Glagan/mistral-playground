<script lang="ts">
	import { joinURL } from 'ufo';
	import LinkIcon from '@lucide/svelte/icons/link';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import InfoIcon from '@lucide/svelte/icons/info';
	import { type ChatState } from '$lib/stores/chat.svelte';
	import type { SelectChatShare } from '$lib/server/schema';
	import { findFirstTextNode } from '$lib/message';
	import { db } from '$lib/stores/db';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	const {
		chat
	}: {
		chat: ChatState;
	} = $props();
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
			body: JSON.stringify(chat)
		});
		const body = (await response.json()) as { chatShare: SelectChatShare };
		shareId = body.chatShare.id;
		deletionKey = body.chatShare.deletionKey;
		await db.share.add({
			id: body.chatShare.id,
			title: findFirstTextNode(chat.messages)?.text ?? '',
			deletionKey: body.chatShare.deletionKey,
			createdAt: body.chatShare.createdAt
		});
		toast.success('Chat share link created');
		loading = false;
	}

	async function copyShareLink(includeDeletion = false) {
		await navigator.clipboard.writeText(
			includeDeletion
				? `${joinURL(window.location.host, 'share', shareId)}?key=${deletionKey}`
				: `${joinURL(window.location.host, 'share', shareId)}`
		);
		toast.success('Chat share link copied');
	}

	async function copyDeletionKey() {
		await navigator.clipboard.writeText(deletionKey);
		toast.success('Deletion key copied');
	}
</script>

<Dialog.Root>
	<Dialog.Trigger>
		<button type="button" class="btn variant-ghost-secondary px-2 py-1 text-xs"> Share </button>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Share</Dialog.Title>
		</Dialog.Header>
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
			<div class="grid grid-cols-2 items-center gap-2">
				<button type="button" onclick={() => copyShareLink()} class="btn variant-ghost-secondary">Copy</button>
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
		{#if shareId}
			<aside class="alert variant-ghost-tertiary p-2">
				<div class="input-group-shim">
					<InfoIcon size={24} />
				</div>
				<div class="alert-message">Your shared chats are saved in your shared chat history.</div>
			</aside>
		{/if}
		<Dialog.Footer>
			<button type="button" class="btn variant-ghost-primary shrink-0" disabled={loading}> Close </button>
			{#if !shareId}
				<button type="submit" class="btn variant-filled-success shrink-0" disabled={loading} onclick={() => generate()}>
					Create
				</button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
