<script lang="ts">
	import { apiKey } from '$lib/stores/apiKey';
	import { Drawer, initializeStores, Modal, getDrawerStore, Toast } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';

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
	import python from 'highlight.js/lib/languages/python';

	const { data, children } = $props();

	if (data.apiKey) {
		apiKey.set(data.apiKey);
	}

	hljs.registerLanguage('xml', xml); // for HTML
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('json', json);
	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('shell', shell);
	hljs.registerLanguage('bash', shell);
	hljs.registerLanguage('ruby', ruby);
	hljs.registerLanguage('sql', sql);
	hljs.registerLanguage('python', python);

	import 'highlight.js/styles/github-dark.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import ChatHistoryList from '$lib/components/ChatHistoryList.svelte';
	import OCRHistoryList from '$lib/components/OCRHistoryList.svelte';

	initializeStores();
	const drawerStore = getDrawerStore();
</script>

<svelte:head>
	<title>Mistral Playground</title>
</svelte:head>

<div class="flex flex-col flex-nowrap lg:grid grid-layout min-h-screen max-h-screen">
	{@render children()}
</div>
<Drawer>
	{#if $drawerStore.id === 'navigation'}
		<Navigation isFromRoot={false} />
	{:else if $drawerStore.id === 'history'}
		<div class="p-2">
			{#if $page.url.pathname === '/chat' && $apiKey}
				<ChatHistoryList mobile={true} />
			{:else if $page.url.pathname === '/ocr' && $apiKey}
				<OCRHistoryList mobile={true} />
			{/if}
		</div>
	{/if}
</Drawer>
<Modal />
<Toast />
