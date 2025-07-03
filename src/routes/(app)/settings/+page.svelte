<script lang="ts">
	import { models } from '$lib/stores/models.svelte';
	import { apiKey } from '$lib/stores/apiKey';
	import { defaultTemperature, settings, settingsSchema } from '$lib/stores/settings';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
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

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	const form = superForm($settings, {
		validators: zodClient(settingsSchema),
		dataType: 'json'
	});

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<form class="flex flex-col items-stretch gap-4 lg:max-w-[30vw]">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">Settings</h1>
	<p class="leading-7">
		Default options replace the Mistral default values and are always applied in new chat sessions.
	</p>
	{#if $apiKey}
		<Form.Field {form} name="model" class="w-full">
			<Form.Control>
				{#snippet children()}
					<Form.Label>Default chat model</Form.Label>
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
												<Command.Item
													value={item.id}
													onSelect={() => {
														$settings.model = item.id;
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
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	{:else}
		<Alert.Root>
			<TriangleAlertIcon />
			<Alert.Title>An API key is required to load available models.</Alert.Title>
		</Alert.Root>
		<Form.Field {form} name="model">
			<Form.Control>
				{#snippet children()}
					<Form.Label>Default chat model</Form.Label>
					{$settings.model}
					<Select.Root type="single" name="model" disabled={models.loading}>
						<Select.Trigger class="w-[180px]">
							{$settings.model ?? 'Select a model...'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item
								value={$settings.model ?? 'Select a model...'}
								label={$settings.model ?? 'Select a model...'}
							>
								{$settings.model ?? 'Select a model...'}
							</Select.Item>
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	{/if}
	<Form.Field {form} name="temperature">
		<Form.Control>
			{#snippet children()}
				<Form.Label>
					Default temperature
					{#if $settings.temperature !== defaultTemperature}
						<Button variant="outline" size="sm" onclick={() => ($settings.temperature = defaultTemperature)}>
							Reset
							<RotateCcwIcon />
						</Button>
					{/if}
				</Form.Label>
				<div class="flex flex-row gap-2">
					<Slider type="single" bind:value={$settings.temperature} min={0} max={1} step={0.01} />
					<span class="w-8">{$settings.temperature}</span>
				</div>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="seed">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>
					Default seed
					{#if $settings.seed}
						<Button variant="outline" size="sm" onclick={() => ($settings.seed = undefined)}>
							Reset
							<RotateCcwIcon />
						</Button>
					{/if}
				</Form.Label>
				<Input {...props} type="number" bind:value={$settings.seed} />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="endpoint">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>
					API endpoint
					{#if $settings.endpoint}
						<Button variant="outline" size="sm" onclick={() => ($settings.endpoint = undefined)}>
							Reset
							<RotateCcwIcon />
						</Button>
					{/if}
				</Form.Label>
				<Input {...props} placeholder={defaultEndpoint} bind:value={$settings.endpoint} />
			{/snippet}
		</Form.Control>
		<Form.Description>Leave empty to use the default Mistral endpoint</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
</form>
<Alert.Root class="lg:max-w-[30vw]">
	<CheckCircle2Icon />
	<Alert.Title>Your settings are automatically saved.</Alert.Title>
</Alert.Root>
