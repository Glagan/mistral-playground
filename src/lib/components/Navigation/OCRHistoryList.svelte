<script lang="ts">
	import { ocr, type OCRState } from '$lib/stores/ocr.svelte';
	import NavHistory from '$lib/components/nav-history.svelte';
	import { tick } from 'svelte';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/stores/db';
	import type { ChatState } from '$lib/stores/chat.svelte';
	import type { TranscribeState } from '$lib/stores/transcribe.svelte';

	const { mobile = false }: { mobile?: boolean } = $props();

	let historyTotal = liveQuery(() => db.ocr.count());
	let ocrHistory = liveQuery(() => db.ocr.reverse().toArray());

	function onLoad(entry: ChatState | OCRState | TranscribeState) {
		if (!('pages' in entry)) {
			return;
		}
		ocr.setFromEntry(entry);
		tick().then(() => {
			const outputNode = document.getElementById('pages-container')!;
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
		});
	}

	async function onFavorite(entry: ChatState | OCRState | TranscribeState) {
		if (!('pages' in entry)) {
			return;
		}
		await db.ocr.update(entry.id, { favorite: !entry.favorite });
	}

	async function onDestroy(entry: ChatState | OCRState | TranscribeState) {
		if (!('pages' in entry)) {
			return;
		}
		await db.ocr.delete(entry.id);
		if (ocr.state.id === entry.id) {
			ocr.reset();
		}
	}
</script>

<NavHistory mode="ocr" items={ocrHistory} total={historyTotal} {onLoad} {onFavorite} {onDestroy} />
