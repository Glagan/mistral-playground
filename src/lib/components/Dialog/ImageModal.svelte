<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { Snippet } from 'svelte';
	import ExpandIcon from '@lucide/svelte/icons/expand';
	import Button from '$lib/components/ui/button/button.svelte';

	let {
		image,
		title,
		disabled,
		children
	}: {
		image: string;
		title: string;
		disabled?: boolean;
		children?: Snippet;
	} = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger>
		{#if children}
			{@render children()}
		{:else}
			<Button {disabled}>
				<ExpandIcon size={16} />
				Expand
			</Button>
		{/if}
	</Dialog.Trigger>
	<Dialog.Content class="flex w-auto items-center justify-center p-8 sm:max-w-[60vw]">
		<img src={image} alt={title} class="rounded-container-token max-h-[90vh] max-w-[90vw] overflow-hidden shadow-xl" />
	</Dialog.Content>
</Dialog.Root>
