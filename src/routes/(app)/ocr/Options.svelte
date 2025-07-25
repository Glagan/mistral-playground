<script lang="ts">
	import { ocr } from '$lib/stores/ocr.svelte';
	import { models } from '$lib/stores/models.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import { cn } from '$lib/utils';
	import ModelInformations from '$lib/components/model-informations.svelte';

	const { class: className = '' }: { class?: string } = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<form class={cn('flex h-full shrink-0 grow flex-col gap-6 overflow-auto lg:w-[25vw] lg:max-w-[25vw]', className)}>
	<div class="flex w-full flex-col gap-1.5">
		<label for="model" class="text-sm leading-none font-medium">Model</label>
		<Popover.Root bind:open>
			<Popover.Trigger bind:ref={triggerRef} class="w-full">
				{#snippet child({ props })}
					<Button variant="outline" class="w-full " {...props} role="combobox" aria-expanded={open}>
						<span class="shrink grow text-left">{ocr.state.options.model || 'Select a model'}</span>
						<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-lg max-w-screen p-0">
				<Command.Root>
					<Command.Input placeholder="Search model..." />
					<Command.List>
						<Command.Empty>No model found.</Command.Empty>
						{#each Object.entries(models.ocrGroups) as [groupName, items]}
							<Command.Group>
								<Select.Label>{groupName}</Select.Label>
								{#each items as item (item.id)}
									<Command.Item
										value={item.id}
										onSelect={() => {
											ocr.state.options.model = item.id;
											closeAndFocusTrigger();
										}}
									>
										{item.id}
									</Command.Item>
								{/each}
							</Command.Group>
						{/each}
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		{#if ocr.model}
			<div>
				<ModelInformations model={ocr.model} />
			</div>
		{/if}
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<Label for="minSize">Image limit</Label>
		<p class="text-muted-foreground text-sm">Max images to extract</p>
		<Input id="minSize" type="number" placeholder="Image limit" bind:value={ocr.state.options.imageLimit} />
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<Label for="minimumSize">Image minimum size</Label>
		<p class="text-muted-foreground text-sm">Minimum height and width of image to extract</p>
		<Input id="minimumSize" type="number" placeholder="Image minimum size" bind:value={ocr.state.options.minSize} />
	</div>
</form>
