<script lang="ts">
	import { tick } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { apiKey } from '$lib/stores/apiKey';
	import { chat } from '$lib/stores/chat.svelte';
	import { code } from '$lib/stores/code.svelte';
	import { page } from '$app/stores';
	import BotIcon from 'lucide-svelte/icons/bot';
	import CandlestickChartIcon from 'lucide-svelte/icons/candlestick-chart';
	import GalleryHorizontalEndIcon from 'lucide-svelte/icons/gallery-horizontal-end';
	import LogOutIcon from 'lucide-svelte/icons/log-out';
	import PackagePlusIcon from 'lucide-svelte/icons/package-plus';
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import GithubIcon from 'lucide-svelte/icons/github';
	import SquareArrowOutUpRightIcon from 'lucide-svelte/icons/square-arrow-out-up-right';
	import CoffeeIcon from 'lucide-svelte/icons/coffee';
	import BracesIcon from 'lucide-svelte/icons/braces';
	import {
		getDrawerStore,
		getModalStore,
		type DrawerSettings,
		type ModalComponent,
		type ModalSettings
	} from '@skeletonlabs/skeleton';
	import { models } from '$lib/stores/models.svelte';
	import { goto } from '$app/navigation';
	import SettingsModal from './SettingsModal.svelte';

	const { isFromRoot }: { isFromRoot: boolean } = $props();

	const modalStore = getModalStore();
	const drawerStore = getDrawerStore();

	function deleteApiKey() {
		apiKey.set('');
		models.error = null;
		goto('/');
	}

	function openSettings() {
		const modalComponent: ModalComponent = { ref: SettingsModal };
		const settingsModal: ModalSettings = {
			type: 'component',
			backdropClasses: 'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
			component: modalComponent
		};
		modalStore.trigger(settingsModal);
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
		chat.reset();
		code.reset();
		drawerStore.close();
	}
</script>

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
		<BotIcon class="flex-shrink-0" />
		<span class="truncate">Chat</span>
	</a>
	{#if $page.url.pathname === '/chat' && chat.state.messages.length}
		<button
			type="button"
			class="btn transition-all justify-start font-bold text-lg ml-8 hover:variant-soft-primary"
			transition:slide={{ axis: 'y' }}
			onclick={resetSession}
		>
			<PackagePlusIcon class="flex-shrink-0" />
			<span class="truncate">New Chat</span>
		</button>
	{/if}
	{#if $page.url.pathname === '/chat' && !isFromRoot}
		<button
			type="button"
			class="btn transition-all justify-start font-bold text-lg ml-8 hover:variant-soft-primary"
			transition:slide={{ axis: 'y' }}
			onclick={openHistoryDrawer}
		>
			<GalleryHorizontalEndIcon class="flex-shrink-0" />
			<span class="truncate">History</span>
		</button>
	{/if}
	<a
		href="/code"
		class="btn transition-all justify-start font-bold text-lg {$page.url.pathname === '/code'
			? 'variant-soft-primary'
			: ' '} hover:variant-soft-primary"
		onclick={() => {
			resetSession();
			drawerStore.close();
		}}
	>
		<BracesIcon class="flex-shrink-0" />
		<span class="truncate">Code</span>
	</a>
	{#if $page.url.pathname === '/code' && code.state.response.length}
		<button
			type="button"
			class="btn transition-all justify-start font-bold text-lg ml-8 hover:variant-soft-primary"
			transition:slide={{ axis: 'y' }}
			onclick={resetSession}
		>
			<PackagePlusIcon class="flex-shrink-0" />
			<span class="truncate">New code generation</span>
		</button>
	{/if}
	{#if $page.url.pathname === '/code' && !isFromRoot}
		<button
			type="button"
			class="btn transition-all justify-start font-bold text-lg ml-8 hover:variant-soft-primary"
			transition:slide={{ axis: 'y' }}
			onclick={openHistoryDrawer}
		>
			<GalleryHorizontalEndIcon class="flex-shrink-0" />
			<span class="truncate">History</span>
		</button>
	{/if}
	<a
		href="/embeddings"
		class="btn transition-all justify-start font-bold text-lg {$page.url.pathname === '/embeddings'
			? 'variant-soft-primary'
			: ' '} hover:variant-soft-primary"
		onclick={() => drawerStore.close()}
	>
		<CandlestickChartIcon class="flex-shrink-0" />
		<span class="truncate">Embeddings</span>
	</a>
	<div class="flex-grow"></div>
	{#if !/\/share/.test($page.url.pathname) && $apiKey}
		<button
			class="btn transition-all justify-start font-bold text-lg hover:variant-soft-primary"
			transition:fade
			onclick={deleteApiKey}
		>
			<LogOutIcon class="flex-shrink-0" />
			<span class="truncate">Delete API key</span>
		</button>
	{/if}
	<a
		href="https://ko-fi.com/glagan"
		target="_blank"
		class="btn transition-all justify-start font-bold text-lg hover:variant-soft-primary"
	>
		<CoffeeIcon class="flex-shrink-0" />
		<span class="truncate">Buy me a coffee</span>
		<SquareArrowOutUpRightIcon size={16} />
	</a>
	<a
		href="https://github.com/Glagan/mistral-playground"
		target="_blank"
		class="btn transition-all justify-start font-bold text-lg hover:variant-soft-primary"
	>
		<GithubIcon class="flex-shrink-0" />
		<span class="truncate">Github</span>
		<SquareArrowOutUpRightIcon size={16} />
	</a>
	{#if !/\/share/.test($page.url.pathname)}
		<button
			class="btn transition-all justify-start font-bold text-lg hover:variant-soft-primary"
			transition:fade
			onclick={openSettings}
		>
			<SettingsIcon class="flex-shrink-0" />
			<span class="truncate">Settings</span>
		</button>
	{/if}
</div>

<style>
</style>
