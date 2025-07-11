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
	import { embeddingTypes, type EmbeddingType } from '$lib/types';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import InfoIcon from '@lucide/svelte/icons/info';

	let {
		model = $bindable(),
		outputDimensions = $bindable(),
		outputType = $bindable(),
		onreset,
		class: className = ''
	}: {
		model: string;
		outputDimensions: number | null;
		outputType: EmbeddingType;
		onreset: () => void;
		class?: string;
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

<form class={['flex h-full shrink grow flex-col gap-6 overflow-auto lg:w-[30vw]', className]}>
	<div class="flex w-full flex-col gap-1.5">
		<label for="topP" class="text-sm leading-none font-medium">Model</label>
		<Popover.Root bind:open>
			<Popover.Trigger bind:ref={triggerRef} class="w-full">
				{#snippet child({ props })}
					<Button variant="outline" class="w-full " {...props} role="combobox" aria-expanded={open}>
						<span class="shrink grow text-left">{model}</span>
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
											model = item.id;
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
			disabled={model === 'mistral-embed'}
			bind:value={outputDimensions}
		/>
		{#if model === 'mistral-embed'}
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
		<Select.Root type="single" name="outputType" disabled={model === 'mistral-embed'} bind:value={outputType}>
			<Select.Trigger class="w-full">
				{outputType}
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
		{#if model === 'mistral-embed'}
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
	<Button class="mx-auto" onclick={() => onreset()}>New embeddings</Button>
</form>
