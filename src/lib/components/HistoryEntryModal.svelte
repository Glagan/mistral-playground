<script lang="ts">
	import type { HistoryEntry } from '$lib/history';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import Messages from './Messages.svelte';

	const modalStore = getModalStore();

	const { entry } = $props<{ entry: HistoryEntry }>();
</script>

{#if $modalStore.length && $modalStore[0]}
	<div>
		<div class="card variant-ghost-surface p-4">
			<Messages messages={entry.messages} />
		</div>
		<div class="flex items-center justify-center mt-2">
			<button class="flex-shrink-0 btn variant-ringed-surface" onclick={() => modalStore.close()}>
				Close
			</button>
		</div>
	</div>
{/if}
