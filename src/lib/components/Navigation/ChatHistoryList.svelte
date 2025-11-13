<script lang="ts">
	import { chat, type ChatState } from '$lib/stores/chat.svelte';
	import { tick } from 'svelte';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/stores/db';
	import NavHistory from '$lib/components/nav-history.svelte';
	import type { OCRState } from '$lib/stores/ocr.svelte';
	import type { TranscribeState } from '$lib/stores/transcribe.svelte';

	let historyTotal = liveQuery(() => db.chat.count());
	let chatHistory = liveQuery(() => db.chat.limit(20).reverse().toArray());

	function onLoad(entry: ChatState | OCRState | TranscribeState) {
		if ('pages' in entry || 'text' in entry) {
			return;
		}
		chat.setFromEntry(entry);
		tick().then(() => {
			const outputNode = document.getElementById('messages-container')!;
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
		});
	}

	async function onFavorite(entry: ChatState | OCRState | TranscribeState) {
		if ('pages' in entry) {
			return;
		}
		await db.chat.update(entry.id, { favorite: !entry.favorite });
	}

	async function onDestroy(entry: ChatState | OCRState | TranscribeState) {
		if ('pages' in entry) {
			return;
		}
		await db.chat.delete(entry.id);
		if (chat.state.id === entry.id) {
			chat.reset();
		}
	}
</script>

<NavHistory mode="chat" items={chatHistory} total={historyTotal} {onLoad} {onFavorite} {onDestroy} />
