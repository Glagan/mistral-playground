<script lang="ts">
	import { ocr, type OCRState } from '$lib/stores/ocr.svelte';
	import NavHistory from '$lib/components/nav-history.svelte';
	import { tick } from 'svelte';
	import hljs from 'highlight.js/lib/core';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/stores/db';
	import type { ChatState } from '$lib/stores/chat.svelte';

	const { mobile = false }: { mobile?: boolean } = $props();

	let ocrHistory = liveQuery(() => db.ocr.reverse().toArray());

	function onLoad(entry: ChatState | OCRState) {
		if (!('pages' in entry)) {
			return;
		}
		ocr.setFromEntry(entry);
		tick().then(() => {
			const outputNode = document.getElementById('pages-container')!;
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
			hljs.highlightAll();
		});
	}

	async function onDestroy(entry: ChatState | OCRState) {
		if (!('pages' in entry)) {
			return;
		}
		await db.chat.delete(entry.id);
		if (ocr.state.id === entry.id) {
			ocr.reset();
		}
	}
</script>

<NavHistory items={ocrHistory} {onLoad} {onDestroy} />
