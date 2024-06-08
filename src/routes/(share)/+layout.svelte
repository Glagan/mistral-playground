<script lang="ts">
	import { Drawer, initializeStores, Modal, type DrawerSettings, getDrawerStore } from '@skeletonlabs/skeleton';
	import BotIcon from 'lucide-svelte/icons/bot';
	import MenuIcon from 'lucide-svelte/icons/menu';
	import GithubIcon from 'lucide-svelte/icons/github';
	import SquareArrowOutUpRightIcon from 'lucide-svelte/icons/square-arrow-out-up-right';
	import CoffeeIcon from 'lucide-svelte/icons/coffee';

	import '../../app.css';

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

	const { children } = $props();

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

	initializeStores();
	const drawerStore = getDrawerStore();

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
</script>

<svelte:head>
	<title>Mistral Playground :: Shared chat</title>
</svelte:head>

{#snippet navigation({ isFromRoot }: { isFromRoot: boolean })}
	<div
		class="{isFromRoot ? 'hidden lg:flex' : 'flex'} flex-col flex-grow justify-start gap-2 {isFromRoot
			? 'px-4'
			: 'p-4 h-full'} w-full"
	>
		<a
			href="/"
			class="btn transition-all justify-start font-bold text-lg hover:variant-soft-primary"
			onclick={() => {
				drawerStore.close();
			}}
		>
			<BotIcon class="flex-shrink-0" />
			<span class="truncate">Home</span>
		</a>
		<div class="flex-grow"></div>
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
	</div>
{/snippet}

<div class="flex flex-col flex-nowrap lg:grid grid-layout min-h-screen max-h-screen">
	<div
		class="flex lg:flex-col flex-grow-0 flex-shrink-0 h-full justify-between lg:justify-normal items-center lg:items-start p-4 gap-4 max-h-screen overflow-auto"
	>
		<img class="block max-h-14 lg:max-h-max lg:mx-auto" src="/logo-dark.webp" alt="Mistral Playground" />
		<div class="flex lg:hidden flex-col items-center gap-2">
			<button type="button" class="transition-all font-bold text-lg" onclick={openNavigationDrawer}>
				<MenuIcon size={40} />
			</button>
		</div>
		{@render navigation({ isFromRoot: true })}
	</div>
	{@render children()}
	<div></div>
</div>
<Drawer>
	{#if $drawerStore.id === 'navigation'}
		{@render navigation({ isFromRoot: false })}
	{/if}
</Drawer>
<Modal />

<style lang="postcss">
	.grid-layout {
		grid-template-columns: 25% 50% 25%;
		grid-auto-rows: minmax(50pc, auto);
	}
</style>
