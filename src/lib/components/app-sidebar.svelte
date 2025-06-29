<script lang="ts" module>
	import BotIcon from '@lucide/svelte/icons/bot';
	import SquareTerminalIcon from '@lucide/svelte/icons/square-terminal';
	import ScanSearchIcon from '@lucide/svelte/icons/scan-search';
	import Settings2Icon from '@lucide/svelte/icons/settings-2';
	import BadgeInfoIcon from '@lucide/svelte/icons/badge-info';
	import GithubIcon from '@lucide/svelte/icons/github';
	import CoffeeIcon from '@lucide/svelte/icons/coffee';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import BookTextIcon from '@lucide/svelte/icons/book-text';
	import FileCodeIcon from '@lucide/svelte/icons/file-code';
	import Share2Icon from '@lucide/svelte/icons/share-2';

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

	let { ref = $bindable(null), collapsible = 'icon', ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<img class="block max-h-10 lg:mx-auto lg:max-h-max" src="/logo-dark.webp" alt="Mistral Playground" />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain title="Playground" items={data.navMain} />
		<NavMain title="Documentation" items={data.navSecondary} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavMain items={data.navFooter} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
