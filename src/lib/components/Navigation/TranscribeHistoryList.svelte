<script lang="ts">
	import { transcribe, type TranscribeState } from '$lib/stores/transcribe.svelte';
	import NavHistory from '$lib/components/nav-history.svelte';
	import { tick } from 'svelte';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/stores/db';
	import type { ChatState } from '$lib/stores/chat.svelte';
	import type { OCRState } from '$lib/stores/ocr.svelte';

	const { mobile = false }: { mobile?: boolean } = $props();

	let transcribeHistory = liveQuery(() => db.transcribe.reverse().toArray());

	function onLoad(entry: ChatState | OCRState | TranscribeState) {
		if (!('text' in entry)) {
			return;
		}
		transcribe.setFromEntry(entry);
		tick().then(() => {
			const outputNode = document.getElementById('text-container')!;
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
		});
	}

	async function onDestroy(entry: ChatState | OCRState | TranscribeState) {
		if (!('text' in entry)) {
			return;
		}
		await db.transcribe.delete(entry.id);
		if (transcribe.state.id === entry.id) {
			transcribe.reset();
		}
	}
</script>

<NavHistory items={transcribeHistory} {onLoad} {onDestroy} />
