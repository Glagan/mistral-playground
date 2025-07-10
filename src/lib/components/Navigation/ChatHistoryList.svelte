<script lang="ts">
	import { chat, type ChatState } from '$lib/stores/chat.svelte';
	import { tick } from 'svelte';
	import hljs from 'highlight.js/lib/core';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/stores/db';
	import NavHistory from '$lib/components/nav-history.svelte';
	import type { OCRState } from '$lib/stores/ocr.svelte';

	let chatHistory = liveQuery(() => db.chat.reverse().toArray());

	function onLoad(entry: ChatState | OCRState) {
		if ('pages' in entry) {
			return;
		}
		chat.setFromEntry(entry);
		tick().then(() => {
			const outputNode = document.getElementById('messages-container')!;
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
			hljs.highlightAll();
		});
	}

	async function onDestroy(entry: ChatState | OCRState) {
		if ('pages' in entry) {
			return;
		}
		await db.chat.delete(entry.id);
		if (chat.state.id === entry.id) {
			chat.reset();
		}
	}
</script>

<NavHistory items={chatHistory} {onLoad} {onDestroy} />
