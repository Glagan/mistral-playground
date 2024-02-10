<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/stores/apiKey';
	import { history } from '$lib/stores/history';
	import {
		Drawer,
		initializeStores,
		Modal,
		type DrawerSettings,
		type ModalComponent,
		type ModalSettings
	} from '@skeletonlabs/skeleton';
	import { getModalStore, getDrawerStore } from '@skeletonlabs/skeleton';
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
	const drawerStore = getDrawerStore();

	const modalRegistry: Record<string, ModalComponent> = {
		settings: { ref: SettingsModal }
	};

	function deleteApiKey() {
		apiKey.set('');
		goto('/');
	}

	function loadHistoryEntry(entry: ChatState) {
		drawerStore.close();
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
			backdropClasses:
				'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
			component: 'settings'
		};
		modalStore.trigger(settingsModal);
	}

	function openHistoryDrawer() {
		const drawerSettings: DrawerSettings = {
			id: 'history',
			// Provide your property overrides:
			bgDrawer: 'bg-surface-900 text-white',
			bgBackdrop: 'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
			width: 'w-[320px] md:w-[540px]',
			padding: 'p-4',
			rounded: 'rounded-xl',
			position: 'right'
		};
		drawerStore.open(drawerSettings);
	}
</script>

<svelte:head>
	<title>Mistral Playground</title>
</svelte:head>

{#snippet historyList({ mobile }: { mobile: boolean })}
	<div
		class="w-full overflow-auto {!mobile ? 'hidden lg:block' : ''}"
		transition:fade={{ duration: 200 }}
	>
		<h2 class="text-lg font-bold mb-2">History</h2>
		<div class="flex flex-col gap-2">
			{#each $history as entry (entry.id)}
				<div
					class="flex flex-col lg:flex-row lg:items-center gap-2 border-2 py-1 rounded-md transition-all {entry.id ===
					$current.state.id
						? 'border-primary-700 bg-primary-700/20 px-2'
						: 'border-transparent lg:px-2'}"
					transition:slide={{ axis: 'y' }}
				>
					{#if entry.messages.length}
						<div class="flex-grow flex-shrink truncate">
							{entry.messages[0].content}
						</div>
					{:else}
						<div class="flex-grow flex-shrink truncate text-surface-200 text-opacity-75 italic">
							Empty prompt
						</div>
					{/if}
					<div class="flex flex-row gap-2 items-end justify-end">
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
				</div>
			{:else}
				<span class="text-sm text-surface-200 text-opacity-75 italic text-center">
					Your history will appear here
				</span>
			{/each}
		</div>
	</div>
{/snippet}

<div class="flex flex-col lg:grid grid-layout min-h-screen">
	<div class="flex h-full items-start justify-between lg:justify-around p-4">
		<img class="block max-h-16 lg:max-h-max" src="/logo-dark.webp" alt="Mistral Playground" />
		{#if $history.length}
			<button
				type="button"
				class="lg:hidden btn variant-filled-primary"
				onclick={openHistoryDrawer}
			>
				History
			</button>
		{/if}
	</div>
	<slot />
	<span class="flex-grow lg:hidden"></span>
	<div
		class="flex flex-row lg:flex-col items-center justify-end lg:justify-normal h-full gap-2 p-4 overflow-hidden max-h-screen"
	>
		{#if $apiKey}
			{@render historyList({ mobile: false })}
			<div class="flex-grow flex-shrink hidden lg:block"></div>
			<button
				class="flex-grow-0 flex-shrink-0 btn variant-ringed-warning"
				transition:fade
				onclick={deleteApiKey}
			>
				Delete API key
			</button>
		{:else}
			<div class="hidden lg:block flex-grow flex-shrink"></div>
		{/if}
		<button
			class="flex-grow-0 flex-shrink-0 btn variant-ringed-warning"
			transition:fade
			onclick={openSettings}
		>
			Settings
		</button>
	</div>
</div>
<Drawer>
	{#if $drawerStore.id === 'history'}
		<div class="p-2">
			{@render historyList({ mobile: true })}
		</div>
	{/if}
</Drawer>
<Modal components={modalRegistry} />

<style lang="postcss">
	.grid-layout {
		grid-template-columns: 2fr 4fr 2fr;
		grid-auto-rows: minmax(50pc, auto);
	}
</style>
