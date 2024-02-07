<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { settings } from '$lib/settings';

	const modalStore = getModalStore();
</script>

<div class="w-modal-slim">
	<h2 class="text-xl">Settings</h2>
	<div class="card variant-filled-surface p-4 min-w-52">
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
	</div>
	<div class="flex items-center justify-center mt-2">
		<button class="flex-shrink-0 btn variant-filled-primary" onclick={() => modalStore.close()}>
			Close
		</button>
	</div>
</div>
