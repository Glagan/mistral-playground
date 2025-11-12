<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { models } from '$lib/stores/models.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import { cn } from '$lib/utils';
	import ModelInformations from '$lib/components/model-informations.svelte';
	import type { ChatOptions } from '$lib/types';
	import ModelSelector from '$lib/components/Chat/ModelSelector.svelte';
	import { slide } from 'svelte/transition';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import type { Snippet } from 'svelte';

	let {
		options = $bindable(),
		expanded = $bindable(false),
		class: className = '',
		compact = false,
		insideContent,
		content,
		onExpand
	}: {
		options: ChatOptions;
		expanded?: boolean;
		class?: string;
		compact?: boolean;
		insideContent?: Snippet;
		content?: Snippet;
		onExpand?: (expanded: boolean) => void;
	} = $props();

	function toggleExpand() {
		expanded = !expanded;
		onExpand?.(expanded);
	}
</script>

{#snippet resetButton(onclick: () => void)}
	<Button variant={compact ? 'secondary' : 'outline'} size={compact ? 'icon' : 'sm'} class="size-4" {onclick}>
		{#if !compact}
			Reset
		{/if}
		<RotateCcwIcon />
	</Button>
{/snippet}

<form class={cn('flex shrink-0 grow flex-col gap-6', className)}>
	<div class="flex shrink flex-col overflow-auto {compact ? 'gap-3' : 'min-h-[30svh] gap-6'}">
		<div class="flex w-full flex-col gap-1.5">
			{#if !compact}
				<label for="model" class="text-sm leading-none font-medium">Model</label>
			{/if}
			<ModelSelector bind:model={options.model} />
			{#if !compact && options.model && models.byName[options.model]}
				<div>
					<ModelInformations model={models.byName[options.model]} />
				</div>
			{/if}
		</div>
		{#if !compact || expanded}
			<div
				class="relative flex flex-col overflow-y-auto {compact ? 'max-h-[300px] gap-3 py-2' : 'gap-6'}"
				transition:slide={{ axis: 'y' }}
			>
				{@render insideContent?.()}
				{#if content}
					{@render content?.()}
				{:else}
					<div class="flex w-full flex-col gap-1.5">
						<label
							for="temperature"
							class="flex flex-row items-center gap-2 leading-none font-medium"
							class:text-sm={!compact}
							class:text-xs={compact}
						>
							<span>Temperature</span>
							{#if options.temperature !== $settings.temperature}
								{@render resetButton(() => (options.temperature = $settings.temperature))}
							{/if}
						</label>
						<div class="flex flex-row gap-2">
							<Slider type="single" bind:value={options.temperature} min={0} max={1} step={0.01} />
							<span class={compact ? 'w-8 text-xs' : 'w-10'}>{options.temperature}</span>
						</div>
					</div>
					<div class="flex w-full flex-col gap-1.5">
						<label
							for="topP"
							class="flex flex-row items-center gap-2 leading-none font-medium"
							class:text-sm={!compact}
							class:text-xs={compact}
						>
							<span>Top P</span>
							{#if options.topP !== 1}
								{@render resetButton(() => (options.topP = 1))}
							{/if}
						</label>
						<div class="flex flex-row gap-2">
							<Slider type="single" id="topP" bind:value={options.topP} min={0} max={1} step={0.01} />
							<span class={compact ? 'w-8 text-xs' : 'w-10'}>{options.topP}</span>
						</div>
					</div>
					{#if compact}
						<div class="flex flex-row items-center justify-between">
							<label for="json_mode" class="text-xs font-medium">JSON</label>
							<Switch id="json_mode" bind:checked={options.json} />
						</div>
					{:else}
						<div class="flex flex-row items-center justify-between rounded-lg border p-4">
							<div class="space-y-0.5">
								<label for="json_mode" class="text-sm leading-none font-medium">JSON</label>
								<div class="text-muted-foreground text-sm">
									Enables JSON mode, which guarantees the message the model generates is in JSON.<br />
									When using JSON mode you MUST also instruct the model to produce JSON yourself with a system or a user
									message.
								</div>
							</div>
							<Switch id="json_mode" bind:checked={options.json} />
						</div>
					{/if}
					<div class="flex w-full flex-col gap-1.5">
						<label
							for="topP"
							class="flex flex-row items-center gap-2 leading-none font-medium"
							class:text-sm={!compact}
							class:text-xs={compact}
						>
							Presence penalty
							{#if options.presencePenalty !== 0}
								{@render resetButton(() => (options.presencePenalty = 0))}
							{/if}
						</label>
						{#if !compact}
							<p class="text-muted-foreground text-sm">
								Determines how much the model penalizes the repetition of words or phrases.
							</p>
						{/if}
						<div class="flex flex-row gap-2">
							<Slider
								type="single"
								id="presencePenalty"
								bind:value={options.presencePenalty}
								min={-2}
								max={2}
								step={0.01}
							/>
							<span class={compact ? 'w-8 text-xs' : 'w-10'}>{options.presencePenalty}</span>
						</div>
					</div>
					<div class="flex w-full flex-col gap-1.5">
						<label
							for="topP"
							class="flex flex-row items-center gap-2 leading-none font-medium"
							class:text-sm={!compact}
							class:text-xs={compact}
						>
							Frequency penalty
							{#if options.frequencyPenalty !== 0}
								{@render resetButton(() => (options.frequencyPenalty = 0))}
							{/if}
						</label>
						{#if !compact}
							<p class="text-muted-foreground text-sm">
								Penalizes the repetition of words based on their frequency in the generated text. A higher frequency
								penalty discourages the model from repeating words that have already appeared frequently in the output,
								promoting diversity and reducing repetition.
							</p>
						{/if}
						<div class="flex flex-row gap-2">
							<Slider
								type="single"
								id="frequencyPenalty"
								bind:value={options.frequencyPenalty}
								min={-2}
								max={2}
								step={0.01}
							/>
							<span class={compact ? 'w-8 text-xs' : 'w-10'}>{options.frequencyPenalty}</span>
						</div>
					</div>
					<div class="flex w-full flex-col gap-1.5">
						<Label for="maxTokens" class={compact ? 'text-xs' : ''}>Max tokens</Label>
						{#if !compact}
							<p class="text-muted-foreground text-sm">The maximum number of tokens to generate in the completion.</p>
						{/if}
						<Input
							id="maxTokens"
							type="number"
							class={compact ? 'h-8 text-xs' : ''}
							placeholder="Max tokens"
							min="1"
							max={models.chat.find((model) => model.id === options.model)?.maxContextLength ?? 32000}
							bind:value={options.maxTokens}
						/>
					</div>
					<div class="flex w-full flex-col gap-1.5">
						<Label for="seed" class={compact ? 'text-xs' : ''}>Seed</Label>
						{#if !compact}
							<p class="text-muted-foreground text-sm">
								The seed to use for random sampling. If set, different calls will generate deterministic results.
							</p>
						{/if}
						<Input
							id="seed"
							type="number"
							class={compact ? 'h-8 text-xs' : ''}
							placeholder="Seed"
							bind:value={options.seed}
						/>
					</div>
					{#if compact}
						<div class="flex flex-row items-center justify-between">
							<label for="safePrompt" class="text-xs font-medium">Safe prompt</label>
							<Switch id="safePrompt" bind:checked={options.safePrompt} />
						</div>
					{:else}
						<div class="flex flex-row items-center justify-between rounded-lg border p-4">
							<div class="space-y-0.5">
								<label for="safePrompt" class="text-sm leading-none font-medium">Safe prompt</label>
								<div class="text-muted-foreground text-sm">
									Whether to inject a safety prompt before all conversations.
								</div>
							</div>
							<Switch id="safePrompt" bind:checked={options.safePrompt} />
						</div>
					{/if}
					{#if compact}
						<div class="flex w-full flex-col gap-1">
							<Label class="text-xs">System prompt</Label>
							<Textarea
								class="min-h-[60px] text-xs"
								rows={3}
								placeholder="System prompt"
								bind:value={options.systemPrompt}
							/>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
	{#if !compact}
		<Textarea class="shrink-0 grow" rows={5} placeholder="System prompt" bind:value={options.systemPrompt} />
	{/if}

	{#if compact}
		<div class="absolute -bottom-3 left-1/2 flex items-center justify-between">
			<Button variant="secondary" onclick={() => toggleExpand()} class="h-6 w-6 border">
				{#if expanded}
					<ChevronUpIcon class="h-4 w-4" />
				{:else}
					<ChevronDownIcon class="h-4 w-4" />
				{/if}
			</Button>
		</div>
	{/if}
</form>
