<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	let { error }: { error: { text: string; body?: object } } = $props();
</script>

<Alert.Root variant="destructive">
	<AlertCircleIcon />
	<Alert.Description>
		<p>{error.text}</p>
		{#if error.body}
			<CodeBlock language="json" code={JSON.stringify(error.body, undefined, 4)} />
		{/if}
	</Alert.Description>
</Alert.Root>
