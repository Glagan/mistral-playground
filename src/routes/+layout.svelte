<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/stores/apiKey';
	import { history } from '$lib/stores/history';
	import {
		initializeStores,
		Modal,
		type ModalComponent,
		type ModalSettings
	} from '@skeletonlabs/skeleton';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import { current, type ChatState } from '$lib/stores/current';

	import '../app.css';

	initializeStores();
	const modalStore = getModalStore();

	const modalRegistry: Record<string, ModalComponent> = {
		settings: { ref: SettingsModal }
	};

	function deleteApiKey() {
		apiKey.set('');
		goto('/');
	}

	function loadHistoryEntry(entry: ChatState) {
		$current = entry;
	}

	function deleteHistoryEntry(entry: ChatState) {
		$history = $history.filter((e) => e.id !== entry.id);
	}

	function openSettings() {
		const settingsModal: ModalSettings = {
			type: 'component',
			component: 'settings'
		};
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
	<div class="flex flex-col items-center h-full p-4 overflow-hidden max-h-screen">
		{#if $apiKey}
			{#if $history.length}
				<div class="w-full overflow-auto" transition:fade={{ duration: 200 }}>
					<h2 class="text-lg font-bold mb-2">History</h2>
					<div class="flex flex-col gap-2">
						{#each $history as entry (entry.id)}
							<div class="flex flex-row items-center gap-2" transition:slide={{ axis: 'y' }}>
								<span class="flex-grow flex-shrink truncate">
									{entry.messages[0].content}
								</span>
								<button
									class="flex-shrink-0 btn variant-ringed-secondary"
									onclick={() => loadHistoryEntry(entry)}
								>
									Load
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
<Modal components={modalRegistry} />

<style lang="postcss">
	.grid-layout {
		grid-template-columns: 2fr 4fr 2fr;
		grid-auto-rows: minmax(50pc, auto);
	}
</style>
