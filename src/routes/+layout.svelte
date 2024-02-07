<script lang="ts">
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/apiKey';
	import { history, type HistoryEntry } from '$lib/history';
	import { initializeStores, Modal, type ModalSettings } from '@skeletonlabs/skeleton';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import HistoryEntryModal from '$lib/components/HistoryEntryModal.svelte';

	import '../app.css';

	initializeStores();
	const modalStore = getModalStore();

	function deleteApiKey() {
		apiKey.set('');
		goto('/');
	}

	function seeHistoryEntry(entry: HistoryEntry) {
		const historyEntryModal: ModalSettings = {
			type: 'component',
			component: {
				ref: HistoryEntryModal,
				props: { entry }
			}
		};
		modalStore.trigger(historyEntryModal);
	}

	function deleteHistoryEntry(entry: HistoryEntry) {
		$history = $history.filter((e) => e.id !== entry.id);
	}

	const settingsModal: ModalSettings = {
		type: 'component',
		component: {
			ref: SettingsModal
		}
	};
	function openSettings() {
		modalStore.trigger(settingsModal);
	}
</script>

<svelte:head>
	<title>Mistral Playground</title>
</svelte:head>

<div class="grid grid-layout min-h-screen">
	<div class="flex h-full items-start justify-around p-4">
		<img class="block" src="/logo.webp" alt="Mistral Playground" />
	</div>
	<slot />
	<div class="flex flex-col items-center h-full p-4 overflow-hidden">
		{#if $apiKey}
			{#if $history.length}
				<div class="w-full overflow-hidden" transition:fade>
					<h2 class="text-lg font-bold mb-2">History</h2>
					<div class="flex flex-col gap-2">
						{#each $history as entry (entry.id)}
							<div class="flex flex-row items-center gap-2">
								<span class="flex-grow flex-shrink truncate">
									{entry.messages[0].content}
								</span>
								<button
									class="flex-shrink-0 btn variant-ringed-secondary"
									onclick={() => seeHistoryEntry(entry)}
								>
									See
								</button>
								<button
									class="flex-shrink-0 btn variant-ringed-error"
									onclick={() => deleteHistoryEntry(entry)}>Delete</button
								>
							</div>
						{/each}
					</div>
				</div>
			{/if}
			<div class="flex-grow flex-shrink"></div>
			<button
				class="flex-grow-0 flex-shrink-0 btn variant-ringed-warning"
				transition:fade
				onclick={deleteApiKey}
			>
				Delete API Key
			</button>
		{:else}
			<div class="flex-grow flex-shrink"></div>
		{/if}
		<button
			class="flex-grow-0 flex-shrink-0 btn variant-ringed-warning mt-2"
			transition:fade
			onclick={openSettings}
		>
			Settings
		</button>
	</div>
</div>
<Modal />

<style lang="postcss">
	.grid-layout {
		grid-template-columns: 2fr 4fr 2fr;
		grid-auto-rows: minmax(50pc, auto);
	}
</style>
