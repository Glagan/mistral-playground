<script lang="ts">
	import { apiKey } from '$lib/apiKey';
	import { fade } from 'svelte/transition';
	import '../app.css';
	import { goto } from '$app/navigation';

	function deleteApiKey() {
		apiKey.set('');
		goto('/');
	}
</script>

<svelte:head>
	<title>Mistral Playground</title>
</svelte:head>

<div class="grid grid-layout min-h-screen">
	<div class="flex h-full items-start justify-around p-4">
		<img class="block" src="/logo.webp" alt="Mistral Playground" />
	</div>
	<slot />
	<div class="flex flex-col items-center h-full p-4">
		<div class="flex-grow flex-shrink"></div>
		{#if $apiKey}
			<button
				class="flex-grow-0 flex-shrink-0 btn variant-ringed-warning"
				transition:fade
				onclick={deleteApiKey}
			>
				Delete API Key
			</button>
		{/if}
	</div>
</div>

<style lang="postcss">
	.grid-layout {
		grid-template-columns: 2fr 4fr 2fr;
		grid-auto-rows: minmax(50pc, auto);
	}
</style>
