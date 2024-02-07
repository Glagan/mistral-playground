<script lang="ts">
	import type { HistoryEntry } from '$lib/history';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import Messages from '$lib/components/Messages.svelte';

	const modalStore = getModalStore();

	const entry = $derived<HistoryEntry>($modalStore?.[0]?.meta.entry);
</script>

{#if $modalStore.length && $modalStore[0]}
	<div class="w-modal">
		<div class="card variant-filled-surface p-4 max-h-96 overflow-auto w-full">
			<Messages messages={entry.messages} />
		</div>
		<div class="flex items-center justify-center mt-2">
			<button class="flex-shrink-0 btn variant-filled-primary" onclick={() => modalStore.close()}>
				Close
			</button>
		</div>
	</div>
{/if}
