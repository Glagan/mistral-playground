<script lang="ts">
	import '../app.css';

	import hljs from 'highlight.js/lib/core';
	import xml from 'highlight.js/lib/languages/xml';
	import css from 'highlight.js/lib/languages/css';
	import json from 'highlight.js/lib/languages/json';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import shell from 'highlight.js/lib/languages/shell';
	import sql from 'highlight.js/lib/languages/sql';
	import python from 'highlight.js/lib/languages/python';
	import Button from '$lib/components/ui/button/button.svelte';

	hljs.registerLanguage('xml', xml);
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('json', json);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('shell', shell);
	hljs.registerLanguage('bash', shell);
	hljs.registerLanguage('sql', sql);
	hljs.registerLanguage('python', python);

	import 'highlight.js/styles/github-dark.css';

	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	import { apiKey } from '$lib/stores/apiKey';
	import { page } from '$app/state';
	import { loadModels } from '$lib/stores/models.svelte';
	import ShareModal from '$lib/components/File/ShareModal.svelte';
	import ExportModal from '$lib/components/File/ExportModal.svelte';
	import { chat } from '$lib/stores/chat.svelte';
	import MessageCirclePlusIcon from '@lucide/svelte/icons/message-circle-plus';
	import { ocr } from '$lib/stores/ocr.svelte';
	import ScanSearchIcon from '@lucide/svelte/icons/scan-search';
	import { embeddings } from '$lib/stores/embeddings.svelte';
	import SquareTerminalIcon from '@lucide/svelte/icons/square-terminal';

	const { data, children } = $props();

	if (data.apiKey) {
		apiKey.set(data.apiKey);
		loadModels();
	}

	const pages: Record<string, string> = {
		chat: 'Chat completion',
		ocr: 'OCR',
		embeddings: 'Embeddings',
		shared: 'Shared chats',
		share: 'Shared chat',
		settings: 'Settings',
		about: 'About',
		'': 'Login'
	};
</script>

<svelte:head>
	<title>Mistral Playground</title>
</svelte:head>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header
			class="flex h-16 shrink-0 grow-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ml-1" />
				<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item class="hidden md:block">
							<Breadcrumb.Link href="#">Mistral Playground</Breadcrumb.Link>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="hidden md:block" />
						<Breadcrumb.Item>
							<Breadcrumb.Page>{pages[page.url.pathname.split('/')[1]]}</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
			{#if page.url.pathname === '/chat' || page.url.pathname === '/ocr' || page.url.pathname === '/embeddings'}
				<div class="flex flex-row gap-2 px-4">
					{#if page.url.pathname === '/chat'}
						<Button variant="secondary" onclick={() => chat.reset()}>
							<MessageCirclePlusIcon />
							<span class="hidden lg:inline">New chat</span>
						</Button>
						<ExportModal />
						<ShareModal />
					{:else if page.url.pathname === '/ocr'}
						<Button variant="secondary" onclick={() => ocr.reset()}>
							<ScanSearchIcon />
							<span class="hidden lg:inline">New scan</span>
						</Button>
					{:else if page.url.pathname === '/embeddings'}
						<Button variant="secondary" onclick={() => embeddings.reset()}>
							<SquareTerminalIcon />
							<span class="hidden lg:inline">New embeddings</span>
						</Button>
					{/if}
				</div>
			{/if}
		</header>
		<div class="main-background flex flex-1 shrink grow flex-col gap-4 p-4 pt-0">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
<Toaster />
