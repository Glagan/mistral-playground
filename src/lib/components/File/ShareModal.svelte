<script lang="ts">
	import { joinURL } from 'ufo';
	import LinkIcon from '@lucide/svelte/icons/link';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import InfoIcon from '@lucide/svelte/icons/info';
	import { chat, type ChatState } from '$lib/stores/chat.svelte';
	import type { SelectChatShare } from '$lib/server/schema';
	import { findFirstTextNode } from '$lib/message';
	import { db } from '$lib/stores/db';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ShareIcon from '@lucide/svelte/icons/share';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let loading = $state(false);
	let open = $state(false);
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
		shareId = body.chatShare.id;
		deletionKey = body.chatShare.deletionKey;
		await db.share.add({
			id: body.chatShare.id,
			title: findFirstTextNode(chat.state.messages)?.text ?? '',
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

	function close() {
		open = false;
		loading = false;
		shareId = '';
		deletionKey = '';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button variant="outline">
			<ShareIcon />
			<span class="hidden lg:inline">Share</span>
		</Button>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{#if shareId}
					Shared chat created
				{:else}
					Share chat
				{/if}
			</Dialog.Title>
		</Dialog.Header>
		<div class="leading-7">The created Shared link is public and can't be deleted without it's key.</div>
		<div class="leading-7">Your API key is safe and <b>not</b> included in the share link.</div>
		{#if shareId}
			<div class="space-y-2">
				<div class="flex items-center gap-2 text-sm leading-none font-medium select-none">Chat share link</div>
				<div class="flex w-full items-center space-x-2">
					<LinkIcon size={24} />
					<Input
						type="text"
						value={joinURL(window.location.host, 'share', shareId)}
						readonly
						placeholder="Chat share link"
						class="shrink grow"
					/>
				</div>
			</div>
			<div class="grid grid-cols-2 items-center gap-2">
				<Button variant="secondary" onclick={() => copyShareLink()}>Copy</Button>
				<Button onclick={() => copyShareLink(true)}>Copy with deletion key</Button>
			</div>
		{/if}
		{#if deletionKey}
			<div class="space-y-2">
				<div class="flex items-center gap-2 text-sm leading-none font-medium select-none">Deletion key</div>
				<div class="flex w-full items-center space-x-2">
					<KeyRoundIcon size={24} />
					<Input type="text" value={deletionKey} readonly placeholder="Deletion key" class="shrink grow" />
					<Button onclick={copyDeletionKey}>Copy</Button>
				</div>
			</div>
		{/if}
		{#if shareId}
			<Alert.Root>
				<InfoIcon size={24} />
				<Alert.Title>Your shared chats are saved in your shared chat history.</Alert.Title>
			</Alert.Root>
		{/if}
		<Dialog.Footer>
			<Button variant={shareId ? 'default' : 'ghost'} disabled={loading} onclick={() => close()}>Close</Button>
			{#if !shareId}
				<Button type="submit" disabled={loading} onclick={() => generate()}>Create</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
