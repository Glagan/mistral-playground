<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { settings } from '$lib/stores/settings';
	import { loadedModels, loadingModels, models } from '$lib/stores/models';
	import { apiKey } from '$lib/stores/apiKey';
	import { current } from '$lib/stores/current.svelte';

	const { parent } = $props<{ parent: SvelteComponent }>();

	const modalStore = getModalStore();

	let previous = $settings.model;
	function onModelChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		$settings.model = target.value;
		if ($current && $current.state.options.model === previous) {
			$current.state.options.model = target.value;
			$current = $current;
		}
		previous = target.value;
	}
</script>

{#if $modalStore[0]}
	<div class="w-modal">
		<h2 class="text-xl">Settings</h2>
		<div class="card variant-filled-surface p-4 flex flex-col gap-4">
			<div>Default options replace the default Mistral defaults and are always applied in new chat sessions.</div>
			{#if $apiKey}
				<label>
					<div class="flex items-center justify-between">
						<span>Default model</span>
						<span>{$settings.model}</span>
					</div>
					<select
						bind:value={$settings.model}
						class="select flex-grow-0"
						disabled={$loadingModels || !$loadedModels}
						onchange={onModelChange}
					>
						{#each $models as item}
							<option value={item.id}>{item.id}</option>
						{/each}
					</select>
				</label>
			{:else}
				<label>
					<div class="flex items-center justify-between">
						<span>Default model</span>
						<span>{$settings.model ?? ''}</span>
					</div>
					<select bind:value={$settings.model} class="select flex-grow-0" disabled={$loadingModels}>
						{#if $settings.model}
							<option value={$settings.model}>{$settings.model}</option>
						{/if}
					</select>
				</label>
			{/if}
			<label>
				<div class="flex items-center justify-between">
					<span>Default temperature</span>
					<span>{$settings.temperature}</span>
				</div>
				<input
					bind:value={$settings.temperature}
					type="range"
					name="temperature"
					id="temperature"
					min="0"
					max="1"
					step="0.01"
					placeholder="Temperature"
				/>
			</label>
			<label>
				<div class="flex items-center justify-between">Default seed</div>
				<input
					bind:value={$settings.seed}
					class="input"
					type="number"
					name="randomSeed"
					id="randomSeed"
					placeholder="Seed"
				/>
			</label>
			<label>
				<div class="flex items-center justify-between">API endpoint</div>
				<input
					bind:value={$settings.endpoint}
					class="input"
					type="text"
					name="endpoint"
					id="endpoint"
					placeholder="API endpoint"
				/>
			</label>
		</div>
		<div class="flex items-center justify-center mt-2">
			<button class="flex-shrink-0 btn variant-filled-primary" onclick={() => modalStore.close()}> Close </button>
		</div>
	</div>
{/if}
