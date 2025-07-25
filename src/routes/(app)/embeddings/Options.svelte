<script lang="ts">
	import { models } from '$lib/stores/models.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { tick } from 'svelte';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { embeddingTypes } from '$lib/types';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import InfoIcon from '@lucide/svelte/icons/info';
	import { cn } from '$lib/utils';
	import { embeddings } from '$lib/stores/embeddings.svelte';
	import ModelInformations from '$lib/components/model-informations.svelte';

	let { class: className = '' }: { class?: string } = $props();

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
						<span class="shrink grow text-left">{embeddings.state.options.model}</span>
						<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-lg max-w-screen p-0">
				<Command.Root>
					<Command.Input placeholder="Search model..." />
					<Command.List>
						<Command.Empty>No model found.</Command.Empty>
						{#each Object.entries(models.embedGroups) as [groupName, items]}
							<Command.Group>
								<Select.Label>{groupName}</Select.Label>
								{#each items as item (item.id)}
									<Command.Item
										value={item.id}
										onSelect={() => {
											embeddings.state.options.model = item.id;
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
		{#if embeddings.model}
			<div>
				<ModelInformations model={embeddings.model} />
			</div>
		{/if}
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<Label for="outputDimensions">Output dimension</Label>
		<p class="text-muted-foreground text-sm">
			The dimension of the output embeddings.<br />
			The maximum number of dimension is 3072 for <code>codestral-embed</code>
		</p>
		<Input
			id="outputDimensions"
			type="number"
			min={1}
			max={3072}
			disabled={embeddings.state.options.model === 'mistral-embed'}
			bind:value={embeddings.state.options.outputDimension}
		/>
		{#if embeddings.state.options.model === 'mistral-embed'}
			<Alert.Root>
				<InfoIcon />
				<Alert.Description>
					<p>
						The output dimension option is not available for <code>mistral-embed</code>.
					</p>
				</Alert.Description>
			</Alert.Root>
		{/if}
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<Label for="outputType">Output type</Label>
		<Select.Root
			type="single"
			name="outputType"
			disabled={embeddings.state.options.model === 'mistral-embed'}
			bind:value={embeddings.state.options.outputDtype}
		>
			<Select.Trigger class="w-full">
				{embeddings.state.options.outputDtype}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					{#each embeddingTypes as type}
						<Select.Item value={type} label={type}>
							{type}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
		{#if embeddings.state.options.model === 'mistral-embed'}
			<Alert.Root>
				<InfoIcon />
				<Alert.Description>
					<p>
						The output dimension option is not available for <code>mistral-embed</code>.
					</p>
				</Alert.Description>
			</Alert.Root>
		{/if}
	</div>
</form>
