<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/stores/apiKey';
	import { models } from '$lib/stores/models.svelte';
	import { onMount } from 'svelte';
	import Cookies from 'js-cookie';

	onMount(() => {
		apiKey.set('');
		models.error = null;
		Cookies.set('apiKey', '');
		goto('/');
	});
</script>
