<script lang="ts">
	import LeftBar from '$lib/components/LeftBar.svelte';

	const { children } = $props();
</script>

<svelte:head>
	<title>Mistral Playground :: Shared chat</title>
</svelte:head>

<LeftBar />
{@render children()}
<div></div>

<style lang="postcss">
</style>
