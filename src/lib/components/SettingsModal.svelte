<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { models } from '$lib/stores/models.svelte';
	import { apiKey } from '$lib/stores/apiKey';
	import { current } from '$lib/stores/current.svelte';
	import { defaultModel, defaultTemperature, settings, settingsSchema, type Settings } from '$lib/stores/settings';
	import { createForm } from 'felte';
	import { validateSchema } from '@felte/validator-zod';
	import { slide } from 'svelte/transition';

	const modalStore = getModalStore();

	const { form, errors } = createForm<Settings>({
		initialValues: {
			model: $settings.model ?? defaultModel,
			temperature: $settings.temperature ?? defaultTemperature,
			seed: $settings.seed ?? undefined,
			endpoint: $settings.endpoint ?? undefined
		},
		validate: validateSchema(settingsSchema),
		onSubmit: async (values) => {
			if (current && current.state.options.model === $settings.model) {
				current.state.options.model = values.model;
			}
			settings.set(values);
			modalStore.close();
		}
	});
</script>

{#if $modalStore[0]}
	<form class="w-modal" use:form>
		<h2 class="text-xl">Settings</h2>
		<div class="card variant-filled-surface p-4 flex flex-col gap-4">
			<div>Default options replace the Mistral default values and are always applied in new chat sessions.</div>
			{#if $apiKey}
				<label>
					<div class="flex items-center justify-between">
						<span>Default model</span>
						<span>{$settings.model}</span>
					</div>
					<select
						name="model"
						class="select flex-grow-0"
						class:input-warning={$errors.model}
						disabled={models.loading || !models.loaded}
					>
						{#each models.list as item}
							<option value={item.id}>{item.id}</option>
						{/each}
					</select>
					{#if $errors.model}
						<span class="text-warning-300 block text-sm" transition:slide={{ axis: 'y' }}>
							{$errors.model}
						</span>
					{/if}
				</label>
			{:else}
				<label>
					<div class="flex items-center justify-between">
						<span>Default model</span>
						<span>{$settings.model ?? ''}</span>
					</div>
					<select class="select flex-grow-0" disabled={models.loading}>
						{#if $settings.model}
							<option value={$settings.model}>{$settings.model}</option>
						{/if}
					</select>
				</label>
			{/if}
			<label>
				<div class="flex items-center justify-between">
					<span>Default temperature</span>
					<span>{$settings.temperature}</span>
				</div>
				<input
					type="range"
					name="temperature"
					id="temperature"
					min="0"
					max="1"
					step="0.01"
					placeholder="Temperature"
					class:input-warning={$errors.temperature}
				/>
				{#if $errors.temperature}
					<span class="text-warning-300 block text-sm" transition:slide={{ axis: 'y' }}>
						{$errors.temperature}
					</span>
				{/if}
			</label>
			<label>
				<div class="flex items-center justify-between">Default seed</div>
				<input
					class="input"
					class:input-warning={$errors.seed}
					type="number"
					name="seed"
					id="seed"
					placeholder="Seed"
				/>
				{#if $errors.seed}
					<span class="text-warning-300 block text-sm" transition:slide={{ axis: 'y' }}>
						{$errors.seed}
					</span>
				{/if}
			</label>
			<label>
				<div class="flex items-center justify-between">API endpoint</div>
				<input
					class="input"
					class:input-warning={$errors.endpoint}
					type="text"
					name="endpoint"
					id="endpoint"
					placeholder="API endpoint"
				/>
				{#if $errors.endpoint}
					<span class="text-warning-300 block text-sm" transition:slide={{ axis: 'y' }}>
						{$errors.endpoint}
					</span>
				{/if}
			</label>
		</div>
		<div class="flex items-center justify-end gap-4 mt-2">
			<button type="button" class="flex-shrink-0 btn variant-ghost-primary" onclick={() => modalStore.close()}>
				Close
			</button>
			<button type="submit" class="flex-shrink-0 btn variant-filled-success"> Save </button>
		</div>
	</form>
{/if}
