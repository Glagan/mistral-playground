<script lang="ts">
	import { goto } from '$app/navigation';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import Repeat2Icon from '@lucide/svelte/icons/repeat-2';
	import { loadModels, models } from '$lib/stores/models.svelte';
	import { apiKey } from '$lib/stores/apiKey';
	import Cookies from 'js-cookie';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import Button from '$lib/components/ui/button/button.svelte';

	function deleteApiKey() {
		apiKey.set('');
		Cookies.set('apiKey', '');
		models.error = null;
		goto('/');
	}

	async function reloadModels() {
		await loadModels();
	}
</script>

{#if models.error}
	<Alert.Root variant="destructive">
		<TriangleAlertIcon />
		<Alert.Title>{models.error.title}</Alert.Title>
		<Alert.Description>
			<p>{models.error.message}</p>
			<div class="flex flex-row items-center gap-2">
				<Button variant="secondary" disabled={models.loading} onclick={deleteApiKey}>
					<LogOutIcon class="shrink-0" />
					<span class="truncate">Delete API key</span>
				</Button>
				<Button variant="destructive" disabled={models.loading} onclick={reloadModels}>
					<Repeat2Icon class="shrink-0" />
					<span class="truncate">Retry</span>
				</Button>
			</div>
		</Alert.Description>
	</Alert.Root>
{/if}
