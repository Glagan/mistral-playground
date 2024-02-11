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
	import { tick } from 'svelte';
	import { page } from '$app/stores';
	import BotIcon from 'lucide-svelte/icons/bot';
	import CandlestickChartIcon from 'lucide-svelte/icons/candlestick-chart';
	import GalleryHorizontalEndIcon from 'lucide-svelte/icons/gallery-horizontal-end';
	import LogOutIcon from 'lucide-svelte/icons/log-out';
	import MenuIcon from 'lucide-svelte/icons/menu';
	import PackagePlusIcon from 'lucide-svelte/icons/package-plus';
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import Trash2Icon from 'lucide-svelte/icons/trash-2';

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
		drawerStore.close();
		const settingsModal: ModalSettings = {
			type: 'component',
			backdropClasses: 'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
			component: 'settings'
		};
		modalStore.trigger(settingsModal);
	}

	function openNavigationDrawer() {
		const drawerSettings: DrawerSettings = {
			id: 'navigation',
			bgDrawer: 'bg-surface-900 text-white',
			bgBackdrop: 'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
			width: 'w-[320px] md:w-[540px]',
			padding: 'p-4',
			rounded: 'rounded-xl',
			position: 'right'
		};
		drawerStore.open(drawerSettings);
	}

	function openHistoryDrawer() {
		resetSession();
		tick().then(() => {
			const drawerSettings: DrawerSettings = {
				id: 'history',
				bgDrawer: 'bg-surface-900 text-white',
				bgBackdrop: 'bg-gradient-to-tr from-secondary-500/50 via-primary-500/50 to-surface-500/50',
				width: 'w-[320px] md:w-[540px]',
				padding: 'p-4',
				rounded: 'rounded-xl',
				position: 'right'
			};
			drawerStore.open(drawerSettings);
		});
	}

	function resetSession(event?: Event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		$current.reset();
		drawerStore.close();
	}
</script>

<svelte:head>
	<title>Mistral Playground</title>
</svelte:head>

{#snippet navigation({ isFromRoot }: { isFromRoot: boolean })}
	<div
		class="{isFromRoot ? 'hidden lg:flex' : 'flex'} flex-col flex-grow justify-start gap-2 {isFromRoot
			? 'px-4'
			: 'p-4 h-full'} w-full"
	>
		<a
			href="/chat"
			class="btn transition-all justify-start font-bold text-lg {$page.url.pathname === '/chat'
				? 'variant-soft-primary'
				: ' '} hover:variant-soft-primary"
			onclick={() => {
				resetSession();
				drawerStore.close();
			}}
		>
			<BotIcon />
			<span>Chat</span>
		</a>
		{#if $page.url.pathname === '/chat' && $current.state.messages.length}
			<button
				type="button"
				class="btn transition-all justify-start font-bold text-lg ml-8 hover:variant-soft-primary"
				transition:slide={{ axis: 'y' }}
				onclick={resetSession}
			>
				<PackagePlusIcon />
				<span>New Chat</span>
			</button>
		{/if}
		{#if !isFromRoot}
			<button
				type="button"
				class="btn transition-all justify-start font-bold text-lg ml-8 hover:variant-soft-primary"
				transition:slide={{ axis: 'y' }}
				onclick={openHistoryDrawer}
			>
				<GalleryHorizontalEndIcon />
				<span>History</span>
			</button>
		{/if}
		<a
			href="/embeddings"
			class="btn transition-all justify-start font-bold text-lg {$page.url.pathname === '/embeddings'
				? 'variant-soft-primary'
				: ' '} hover:variant-soft-primary"
			onclick={() => drawerStore.close()}
		>
			<CandlestickChartIcon />
			<span>Embeddings</span>
		</a>
		<div class="flex-grow"></div>
		{#if $apiKey}
			<button
				class="btn transition-all justify-start font-bold text-lg hover:variant-soft-primary"
				transition:fade
				onclick={deleteApiKey}
			>
				<LogOutIcon />
				<span>Delete API key</span>
			</button>
		{/if}
		<button
			class="btn transition-all justify-start font-bold text-lg hover:variant-soft-primary"
			transition:fade
			onclick={openSettings}
		>
			<SettingsIcon />
			<span>Settings</span>
		</button>
	</div>
{/snippet}

{#snippet historyList({ mobile }: { mobile: boolean })}
	<div class="w-full overflow-auto p-4 {!mobile ? 'hidden lg:block' : ''}" transition:fade={{ duration: 200 }}>
		<h2 class="flex flex-row items-center gap-2 text-lg font-bold mb-2">
			<GalleryHorizontalEndIcon />
			<span>History</span>
		</h2>
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
						<div class="flex-grow flex-shrink truncate text-surface-200 text-opacity-75 italic">Empty prompt</div>
					{/if}
					<div class="flex flex-row gap-2 items-end justify-end">
						{#if entry.id !== $current.state.id}
							<button class="flex-shrink-0 btn variant-ringed-secondary" onclick={() => loadHistoryEntry(entry)}>
								Load
							</button>
						{/if}
						<button class="flex-shrink-0 btn variant-ringed-error" onclick={() => deleteHistoryEntry(entry)}>
							<Trash2Icon />
						</button>
					</div>
				</div>
			{:else}
				<span class="text-sm text-surface-200 text-opacity-75 italic text-center"> Your history will appear here </span>
			{/each}
		</div>
	</div>
{/snippet}

<div class="flex flex-col flex-nowrap lg:grid grid-layout min-h-screen max-h-screen">
	<div
		class="flex lg:flex-col flex-grow-0 flex-shrink-0 h-full justify-between lg:justify-normal items-center lg:items-start p-4 gap-4"
	>
		<img class="block max-h-14 lg:max-h-max lg:mx-auto" src="/logo-dark.webp" alt="Mistral Playground" />
		<div class="flex lg:hidden flex-col items-center gap-2">
			<button type="button" class="transition-all font-bold text-lg" onclick={openNavigationDrawer}>
				<MenuIcon size={40} />
			</button>
		</div>
		{@render navigation({ isFromRoot: true })}
	</div>
	<slot />
	<div
		class="hidden lg:flex flex-row lg:flex-col items-center justify-end lg:justify-normal h-full gap-2 p-4 overflow-hidden max-h-screen"
	>
		{#if $page.url.pathname === '/chat' && $apiKey}
			{@render historyList({ mobile: false })}
		{/if}
	</div>
</div>
<Drawer>
	{#if $drawerStore.id === 'navigation'}
		{@render navigation({ isFromRoot: false })}
	{:else if $drawerStore.id === 'history'}
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
