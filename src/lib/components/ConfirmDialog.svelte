<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { Snippet } from 'svelte';

	const {
		title,
		description,
		trigger,
		children,
		onConfirm
	}: { title: string; description?: string; trigger: Snippet; children?: Snippet; onConfirm: () => void } = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger>
		{@render trigger()}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			{#if description}
				<Dialog.Description>{description}</Dialog.Description>
			{/if}
		</Dialog.Header>
		{@render children?.()}
		<Dialog.Footer>
			<button type="button" class="btn variant-ghost-primary shrink-0">Cancel</button>
			<button type="button" class="btn variant-filled-error shrink-0" onclick={() => onConfirm()}> Delete </button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
