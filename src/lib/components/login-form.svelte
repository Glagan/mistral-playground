<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import { apiKey } from '$lib/stores/apiKey';
	import { goto } from '$app/navigation';
	import Cookies from 'js-cookie';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();

	let apiKeyInput = $state('');

	function onsubmit(event: Event) {
		event.preventDefault();
		if (apiKeyInput) {
			// Create a cookie to be able to render the index page on the server if possible
			Cookies.set('apiKey', apiKeyInput);
			apiKey.set(apiKeyInput);
			goto('/chat');
		}
	}
</script>

<div class={cn('flex flex-col gap-6', className)} bind:this={ref} {...restProps}>
	<form {onsubmit}>
		<div class="flex flex-col gap-6">
			<div class="flex flex-col items-center gap-2">
				<h1 class="text-xl font-bold">Mistral Playground</h1>
				<div class="text-center text-sm">
					Don't have an API key?
					<a href="https://mistral.ai/" class="underline underline-offset-4"> Sign up </a>
				</div>
			</div>
			<div class="flex flex-col gap-6">
				<div class="grid gap-3">
					<Label for="api-key">API key</Label>
					<Input id="api-key" type="password" placeholder="API key" required bind:value={apiKeyInput} />
				</div>
				<Button type="submit" class="w-full">Login</Button>
			</div>
		</div>
	</form>
</div>
