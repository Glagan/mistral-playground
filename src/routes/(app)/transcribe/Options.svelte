<script lang="ts">
	import { models } from '$lib/stores/models.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';
	import { cn } from '$lib/utils';
	import ModelInformations from '$lib/components/model-informations.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { transcribe } from '$lib/stores/transcribe.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import Slider from '$lib/components/ui/slider/slider.svelte';

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
						<span class="shrink grow text-left">{transcribe.state.options.model || 'Select a model'}</span>
						<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-lg max-w-screen p-0">
				<Command.Root>
					<Command.Input placeholder="Search model..." />
					<Command.List>
						<Command.Empty>No model found.</Command.Empty>
						{#each Object.entries(models.transcribeGroups) as [groupName, items]}
							<Command.Group>
								<Select.Label>{groupName}</Select.Label>
								{#each items as item (item.id)}
									<Command.Item
										value={item.id}
										onSelect={() => {
											transcribe.state.options.model = item.id;
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
		{#if transcribe.model}
			<div>
				<ModelInformations model={transcribe.model} />
			</div>
		{/if}
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<label for="temperature" class="text-sm leading-none font-medium"> Temperature </label>
		<div class="flex flex-row gap-2">
			<Slider type="single" bind:value={transcribe.state.options.temperature} min={0} max={1} step={0.01} />
			<span class="w-10">{transcribe.state.options.temperature}</span>
		</div>
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<Label for="language">Language</Label>
		<Input id="language" placeholder="Language code" bind:value={transcribe.state.options.language} />
	</div>
	<div class="flex flex-row items-center justify-between rounded-lg border p-4">
		<div class="space-y-0.5">
			<label for="segments" class="text-sm leading-none font-medium">Segments</label>
		</div>
		<Switch id="segments" bind:checked={transcribe.state.options.timestampGranularities} />
	</div>
</form>
