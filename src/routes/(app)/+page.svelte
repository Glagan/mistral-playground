<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiKey } from '$lib/stores/apiKey';
	import { browser } from '$app/environment';
	import LoginForm from '$lib/components/login-form.svelte';

	if (browser && $apiKey) {
		goto('/chat', { replaceState: true });
	}
</script>

<div class="bg-background flex grow flex-col items-center justify-center gap-6 p-6 md:p-10">
	<div class="w-full max-w-sm">
		<LoginForm />
	</div>
</div>
