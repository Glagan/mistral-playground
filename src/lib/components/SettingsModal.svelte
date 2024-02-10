<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { settings } from '$lib/stores/settings';

	const modalStore = getModalStore();
</script>

<div class="w-modal">
	<h2 class="text-xl">Settings</h2>
	<div class="card variant-filled-surface p-4 flex flex-col gap-4">
		<div>
			Default options replace the default Mistral defaults and are always applied in new chat
			sessions.
		</div>
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
		<div class="h-[1px] bg-white w-full rounded"></div>
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
		<button class="flex-shrink-0 btn variant-filled-primary" onclick={() => modalStore.close()}>
			Close
		</button>
	</div>
</div>
