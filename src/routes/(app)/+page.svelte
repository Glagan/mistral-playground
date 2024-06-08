<script lang="ts">
	import { SlideToggle, focusTrap } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/stores/apiKey';
	import { browser } from '$app/environment';

	if (browser && $apiKey) {
		goto('/chat', { replaceState: true });
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
	<div class="flex justify-center flex-grow flex-col gap-2">
		<div class="text-lucky-point-400">This playground require an API key:</div>
		<div>
			If you don't have a Mistral account, you can create one <a
				href="https://mistral.ai/"
				class="text-primary-600 hover:underline"
				rel="noreferrer noopener">here</a
			>.
		</div>
		<form class="flex flex-col gap-2" use:focusTrap={true} onsubmit={onSubmit}>
			<div class="flex gap-1 w-full">
				<input
					bind:value={apiKeyInput}
					class="input"
					type="password"
					name="apiKey"
					id="apiKey"
					placeholder="API key"
					data-focusindex="0"
				/>
				<button class="btn variant-filled-primary" type="submit">Start</button>
			</div>
		</form>
	</div>
</div>

<style lang="postcss">
</style>
