<script lang="ts">
	import { focusTrap } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/apiKey';
	import { browser } from '$app/environment';

	if (browser && $apiKey) {
		goto('/chat');
	}

	let apiKeyInput = $state('');

	function onSubmit(event: Event) {
		event.preventDefault();
		if (apiKeyInput) {
			apiKey.set(apiKeyInput);
			goto('/chat');
		}
	}
</script>

<div class="flex justify-center items-stretch flex-col gap-4 p-4">
	<div class="flex flex-grow flex-col gap-2">
		<span class="text-lucky-point-400"> This playground require an API key: </span>
		<form class="flex gap-2" use:focusTrap={true} onsubmit={onSubmit}>
			<input
				bind:value={apiKeyInput}
				class="input"
				type="text"
				name="apiKey"
				id="apiKey"
				placeholder="API Key"
				data-focusindex="0"
			/>
			<button class="btn variant-filled-primary" type="submit">Start</button>
		</form>
	</div>
</div>

<style lang="postcss">
</style>
