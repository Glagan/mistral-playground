<script lang="ts">
	import { models } from '$lib/stores/models.svelte';
	import { apiKey } from '$lib/stores/apiKey';
	import { defaultTemperature, settings } from '$lib/stores/settings';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { defaultEndpoint } from '$lib/mistral';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { tick } from 'svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import ModelInformations from '$lib/components/model-informations.svelte';

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	let defaultModel = $derived(models.byName[$settings.model]);
</script>

<form class="flex flex-col items-stretch gap-4 lg:max-w-[30vw]">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Settings</h1>
	<p class="leading-7">
		Default options replace the Mistral default values and are always applied in new chat sessions.
	</p>
	{#if $apiKey}
		<label for="model" class="text-sm leading-none font-medium">Default chat model</label>
		<Popover.Root bind:open>
			<Popover.Trigger bind:ref={triggerRef} class="w-full">
				{#snippet child({ props })}
					<Button variant="outline" class="w-full " {...props} role="combobox" aria-expanded={open}>
						<span class="shrink grow text-left">{$settings.model || 'Select a model'}</span>
						<ChevronsUpDownIcon class="ml-2 size-4 shrink-0 opacity-50" />
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
														$settings.model = item.id;
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
		{#if defaultModel}
			<div>
				<ModelInformations model={defaultModel} />
			</div>
		{/if}
	{:else}
		<Alert.Root>
			<TriangleAlertIcon />
			<Alert.Title>An API key is required to load available models.</Alert.Title>
		</Alert.Root>
		<label for="topP" class="text-sm leading-none font-medium">Default chat model</label>
		{$settings.model}
		<Select.Root type="single" name="model" disabled={models.loading}>
			<Select.Trigger class="w-[180px]">
				{$settings.model ?? 'Select a model...'}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value={$settings.model ?? 'Select a model...'} label={$settings.model ?? 'Select a model...'}>
					{$settings.model ?? 'Select a model...'}
				</Select.Item>
			</Select.Content>
		</Select.Root>
	{/if}
	<label for="topP" class="text-sm leading-none font-medium">
		Default temperature
		{#if $settings.temperature !== defaultTemperature}
			<Button variant="outline" size="sm" onclick={() => ($settings.temperature = defaultTemperature)}>
				Reset
				<RotateCcwIcon />
			</Button>
		{/if}
	</label>
	<div class="flex flex-row gap-2">
		<Slider type="single" bind:value={$settings.temperature} min={0} max={1} step={0.01} />
		<span class="w-8">{$settings.temperature}</span>
	</div>
	<label for="topP" class="text-sm leading-none font-medium">
		Default seed
		{#if $settings.seed}
			<Button variant="outline" size="sm" onclick={() => ($settings.seed = undefined)}>
				Reset
				<RotateCcwIcon />
			</Button>
		{/if}
	</label>
	<Input type="number" bind:value={$settings.seed} />
	<label for="topP" class="text-sm leading-none font-medium">
		API endpoint
		{#if $settings.endpoint}
			<Button variant="outline" size="sm" onclick={() => ($settings.endpoint = undefined)}>
				Reset
				<RotateCcwIcon />
			</Button>
		{/if}
	</label>
	<Input placeholder={defaultEndpoint} bind:value={$settings.endpoint} />
	<p class="text-muted-foreground text-sm">Leave empty to use the default Mistral endpoint.</p>
</form>
<Alert.Root class="lg:max-w-[30vw]">
	<CheckCircle2Icon />
	<Alert.Title>Your settings are automatically saved.</Alert.Title>
</Alert.Root>
