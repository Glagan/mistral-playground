<script lang="ts">
	import { fly } from 'svelte/transition';
	import GalleryHorizontalEndIcon from 'lucide-svelte/icons/gallery-horizontal-end';
	import Trash2Icon from 'lucide-svelte/icons/trash-2';
	import { chat, type ChatState } from '$lib/stores/chat.svelte';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { tick } from 'svelte';
	import hljs from 'highlight.js/lib/core';
	import { findFirstTextNode } from '$lib/message';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/stores/db';

	const { mobile = false }: { mobile?: boolean } = $props();

	const drawerStore = getDrawerStore();

	let chatHistory = liveQuery(() => db.chat.reverse().toArray());

	function loadHistoryChatEntry(entry: ChatState) {
		drawerStore.close();
		chat.setFromEntry(entry);
		tick().then(() => {
			const outputNode = document.getElementById('messages-container')!;
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
			hljs.highlightAll();
		});
	}

	async function deleteHistoryChatEntry(entry: ChatState) {
		await db.chat.delete(entry.id);
		if (chat.state.id === entry.id) {
			chat.reset();
		}
	}
</script>

<div class="w-full flex-shrink overflow-auto p-4 {!mobile ? 'hidden lg:block' : ''}">
	<h2 class="flex flex-row items-center gap-2 text-lg font-bold mb-2">
		<GalleryHorizontalEndIcon />
		<span>History</span>
	</h2>
	<div class="flex flex-col gap-2 overflow-hidden">
		{#each $chatHistory as entry, index (entry.id)}
			{@const firstTextNode = findFirstTextNode(entry.messages)}
			<div
				class="flex flex-col lg:flex-row lg:items-center gap-2 border-2 py-1 rounded-md transition-all {entry.id ===
				chat.state.id
					? 'border-primary-700 bg-primary-700/20 px-2'
					: 'border-transparent lg:px-2'}"
				transition:fly={{ x: 20, delay: 50 * index }}
			>
				{#if firstTextNode?.text}
					<div class="flex-grow flex-shrink truncate">
						{firstTextNode.text}
					</div>
				{:else}
					<div class="flex-grow flex-shrink truncate text-surface-200 text-opacity-75 italic">Empty prompt</div>
				{/if}
				<div class="flex flex-row gap-2 items-end justify-end">
					{#if entry.id !== chat.state.id}
						<button class="flex-shrink-0 btn variant-ringed-secondary" onclick={() => loadHistoryChatEntry(entry)}>
							Load
						</button>
					{/if}
					<button class="flex-shrink-0 btn variant-ringed-error" onclick={() => deleteHistoryChatEntry(entry)}>
						<Trash2Icon />
					</button>
				</div>
			</div>
		{:else}
			<span class="text-sm text-surface-200 text-opacity-75 italic text-center"> Your history will appear here </span>
		{/each}
	</div>
</div>

<style>
</style>
