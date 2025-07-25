<script lang="ts" module>
	import BotIcon from '@lucide/svelte/icons/bot';
	import SquareTerminalIcon from '@lucide/svelte/icons/square-terminal';
	import ScanSearchIcon from '@lucide/svelte/icons/scan-search';
	import Settings2Icon from '@lucide/svelte/icons/settings-2';
	import BadgeInfoIcon from '@lucide/svelte/icons/badge-info';
	import GithubIcon from '@lucide/svelte/icons/github';
	import CoffeeIcon from '@lucide/svelte/icons/coffee';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import BookTextIcon from '@lucide/svelte/icons/book-text';
	import FileCodeIcon from '@lucide/svelte/icons/file-code';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import MicIcon from '@lucide/svelte/icons/mic';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	const data = {
		navMain: [
			{
				title: 'Chat',
				url: '/chat',
				icon: BotIcon,
				isActive: true,
				disableLoggedOut: true
			},
			{
				title: 'Shared chats',
				url: '/shared',
				icon: Share2Icon
			},
			{
				title: 'OCR',
				url: '/ocr',
				icon: ScanSearchIcon,
				disableLoggedOut: true
			},
			{
				title: 'Transcribe',
				url: '/transcribe',
				icon: MicIcon,
				disableLoggedOut: true
			},
			{
				title: 'Embeddings',
				url: '/embeddings',
				icon: SquareTerminalIcon,
				disableLoggedOut: true
			}
		],
		navSecondary: [
			{
				title: 'Mistral',
				url: 'https://docs.mistral.ai/',
				icon: BookTextIcon
			},
			{
				title: 'API',
				url: 'https://docs.mistral.ai/api/',
				icon: FileCodeIcon
			}
		],
		navFooter: [
			{
				title: 'Add API key',
				url: '/',
				icon: LogInIcon,
				hideLoggedIn: true
			},
			{
				title: 'Delete API key',
				url: '/logout',
				icon: LogOutIcon,
				hideLoggedOut: true
			},
			{
				title: 'Buy me a coffee',
				url: 'https://ko-fi.com/glagan',
				icon: CoffeeIcon
			},
			{
				title: 'Github',
				url: 'https://github.com/Glagan/mistral-playground',
				icon: GithubIcon
			},
			{
				title: 'About',
				url: '/about',
				icon: BadgeInfoIcon
			},
			{
				title: 'Toggle theme',
				component: ThemeToggle
			},
			{
				title: 'Settings',
				url: '/settings',
				icon: Settings2Icon
			}
		]
	};
</script>

<script lang="ts">
	import NavMain from './nav-main.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { page } from '$app/state';
	import ChatHistoryList from './Navigation/ChatHistoryList.svelte';
	import OcrHistoryList from './Navigation/OCRHistoryList.svelte';
	import TranscribeHistoryList from './Navigation/TranscribeHistoryList.svelte';

	let { ref = $bindable(null), collapsible = 'icon', ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const isInChat = $derived(page.url.pathname === '/chat');
	const isInOcr = $derived(page.url.pathname === '/ocr');
	const isInTranscribe = $derived(page.url.pathname === '/transcribe');
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<img class="block lg:mx-auto lg:max-h-max" src="/logo-dark.webp" alt="Mistral Playground" />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain title="Playground" items={data.navMain} />
		{#if isInChat}
			<ChatHistoryList />
		{:else if isInOcr}
			<OcrHistoryList />
		{:else if isInTranscribe}
			<TranscribeHistoryList />
		{/if}
		<NavMain title="Documentation" items={data.navSecondary} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavMain items={data.navFooter} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
