<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import TriangleAlertIcon from 'lucide-svelte/icons/triangle-alert';
	import LogOutIcon from 'lucide-svelte/icons/log-out';
	import Repeat2Icon from 'lucide-svelte/icons/repeat-2';
	import { loadModels, models } from '$lib/stores/models.svelte';
	import { apiKey } from '$lib/stores/apiKey';

	function deleteApiKey() {
		apiKey.set('');
		models.error = null;
		goto('/');
	}

	async function reloadModels() {
		await loadModels();
	}
</script>

{#if models.error}
	<div class="alert variant-ghost-error">
		<div>
			<TriangleAlertIcon size={24} />
		</div>
		<div class="alert-message">
			<h3 class="text-xl">{models.error.title}</h3>
			<p>{models.error.message}</p>
			<div class="flex flex-row gap-2 items-center">
				<button
					type="button"
					class="btn justify-start font-bold transition-all variant-ringed-primary disabled:opacity-75"
					transition:fade
					disabled={models.loading}
					onclick={deleteApiKey}
				>
					<LogOutIcon class="flex-shrink-0" />
					<span class="truncate">Delete API key</span>
				</button>
				<button
					type="button"
					class="btn justify-start font-bold transition-all variant-ringed-secondary disabled:opacity-75"
					transition:fade
					disabled={models.loading}
					onclick={reloadModels}
				>
					<Repeat2Icon class="flex-shrink-0" />
					<span class="truncate">Retry</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
</style>
