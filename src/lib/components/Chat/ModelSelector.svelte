<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { tick } from 'svelte';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import ModelInformations from '$lib/components/model-informations.svelte';
	import { models } from '$lib/stores/models.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	let {
		model = $bindable()
	}: {
		model: string;
	} = $props();

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={triggerRef} class="w-full">
		{#snippet child({ props })}
			<Button variant="outline" class="h-8 w-full text-xs" {...props} role="combobox" aria-expanded={open}>
				<span class="shrink grow truncate text-left">{model || 'Select'}</span>
				<ChevronsUpDownIcon class="ml-2 size-3 shrink-0 opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-lg max-w-screen p-0">
		<Command.Root>
			<Command.Input placeholder="Search model..." />
			<Command.List>
				<Command.Empty>No model found.</Command.Empty>
				{#each Object.entries(models.chatGroups) as [groupName, items]}
					<Command.Group>
						<Select.Label>{groupName}</Select.Label>
						{#each items as item (item.id)}
							<Tooltip.Provider delayDuration={0}>
								<Tooltip.Root>
									<Tooltip.Trigger class="block w-full">
										<Command.Item
											value={item.id}
											onSelect={() => {
												model = item.id;
												closeAndFocusTrigger();
											}}
										>
											{item.id}
										</Command.Item>
									</Tooltip.Trigger>
									<Tooltip.Content
										arrowClasses="bg-card dark:bg-sidebar"
										class="bg-card dark:bg-sidebar border-background flex flex-col gap-2 border"
										side="right"
									>
										<ModelInformations model={item} />
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/each}
					</Command.Group>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
