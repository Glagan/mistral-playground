<script lang="ts">
	import { page } from '$app/stores';
	import ChatHistoryList from '$lib/components/ChatHistoryList.svelte';
	import LeftBar from '$lib/components/LeftBar.svelte';
	import { apiKey } from '$lib/stores/apiKey';

	const { children } = $props();
</script>

<svelte:head>
	<title>Mistral Playground</title>
</svelte:head>

<LeftBar />
{@render children()}
<div
	class="hidden lg:flex flex-row lg:flex-col items-center justify-end lg:justify-normal h-full gap-2 p-4 overflow-hidden max-h-screen"
>
	{#if $page.url.pathname === '/chat' && $apiKey}
		<ChatHistoryList mobile={false} />
	{/if}
</div>

<style lang="postcss">
</style>
