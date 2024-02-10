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
	import { current, type ChatState } from '$lib/stores/current.svelte';

	import '../app.css';

	import hljs from 'highlight.js/lib/core';
	// hljs
	import xml from 'highlight.js/lib/languages/xml'; // for HTML
	import css from 'highlight.js/lib/languages/css';
	import json from 'highlight.js/lib/languages/json';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import shell from 'highlight.js/lib/languages/shell';
	import ruby from 'highlight.js/lib/languages/ruby';
	import sql from 'highlight.js/lib/languages/sql';

	hljs.registerLanguage('xml', xml); // for HTML
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('json', json);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('shell', shell);
	hljs.registerLanguage('bash', shell);
	hljs.registerLanguage('ruby', ruby);
	hljs.registerLanguage('sql', sql);

	import 'highlight.js/styles/github-dark.css';
	import { tick } from 'svelte';

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
		$current.setFromEntry(entry);
		tick().then(() => {
			const outputNode = document.getElementById('messages-container')!;
			outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			hljs.highlightAll();
		});
	}

	function deleteHistoryEntry(entry: ChatState) {
		$history = $history.filter((e) => e.id !== entry.id);
		if ($current.state.id === entry.id) {
			$current.reset();
		}
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

<div class="flex flex-col lg:grid grid-layout min-h-screen">
	<div class="flex h-full items-start justify-around p-4">
		<img class="block" src="/logo.webp" alt="Mistral Playground" />
	</div>
	<slot />
	<div class="flex flex-col items-center h-full p-4 overflow-hidden max-h-screen">
		{#if $apiKey}
			<div class="w-full overflow-auto" transition:fade={{ duration: 200 }}>
				<h2 class="text-lg font-bold mb-2">History</h2>
				<div class="flex flex-col gap-2">
					{#each $history as entry (entry.id)}
						<div
							class="flex flex-row items-center gap-2 border-2 py-1 px-2 rounded-md transition-all {entry.id ===
							$current.state.id
								? 'border-primary-700 bg-primary-700/20'
								: 'border-transparent'}"
							transition:slide={{ axis: 'y' }}
						>
							{#if entry.messages.length}
								<span class="flex-grow flex-shrink truncate">
									{entry.messages[0].content}
								</span>
							{:else}
								<span
									class="flex-grow flex-shrink truncate text-surface-200 text-opacity-75 italic"
								>
									Empty prompt
								</span>
							{/if}
							{#if entry.id !== $current.state.id}
								<button
									class="flex-shrink-0 btn variant-ringed-secondary"
									onclick={() => loadHistoryEntry(entry)}
								>
									Load
								</button>
							{/if}
							<button
								class="flex-shrink-0 btn variant-ringed-error"
								onclick={() => deleteHistoryEntry(entry)}>Delete</button
							>
						</div>
					{:else}
						<span class="text-sm text-surface-200 text-opacity-75 italic text-center">
							Your history will appear here
						</span>
					{/each}
				</div>
			</div>
			<div class="flex-grow flex-shrink"></div>
			<button
				class="flex-grow-0 flex-shrink-0 btn variant-ringed-warning"
				transition:fade
				onclick={deleteApiKey}
			>
				Delete API key
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
