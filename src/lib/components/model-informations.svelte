<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import BrainIcon from '@lucide/svelte/icons/brain';
	import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { priceForModel, type MergedModel } from '$lib/stores/models.svelte';

	let { model }: { model: MergedModel } = $props();
	let price = $derived(priceForModel(model));

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	});
</script>

<div class="flex flex-row flex-wrap items-center gap-2">
	{#if model.capabilities.completionChat}
		<Badge>Chat</Badge>
	{/if}
	{#if model.capabilities.vision}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Badge>
						<EyeIcon />
						Vision
					</Badge>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Has image capabilities</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}
	{#if model.reasoning}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Badge>
						<BrainIcon />
						Reasoning
					</Badge>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Supports advanced reasoning</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}
	{#if model.transcribe}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Badge>
						<AudioLinesIcon />
						Transcribe
					</Badge>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>Supports transcribing audio files</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}
	{#if model.capabilities.functionCalling}
		<Badge variant="outline" class="dark:text-sidebar-foreground">Function calling</Badge>
	{/if}
	{#if model.capabilities.fineTuning}
		<Badge variant="outline" class="dark:text-sidebar-foreground">Finetune</Badge>
	{/if}
	{#if model.capabilities.classification}
		<Badge variant="outline" class="dark:text-sidebar-foreground">Classification</Badge>
	{/if}
</div>
<div class="text-card-foreground dark:text-sidebar-foreground flex flex-row flex-wrap items-center gap-2">
	<div>
		<Badge>{model.maxContextLength}</Badge> <span>Context length</span>
	</div>
	{#if price}
		<div>
			<Badge class="bg-sky-200">Input</Badge>
			<span>{formatter.format(price.input)}</span>
			<span class="text-muted dark:text-muted-foreground">/ 1M tokens</span>
		</div>
		<div>
			<Badge class="bg-lime-200">Output</Badge>
			<span>{formatter.format(price.output)}</span>
			<span class="text-muted dark:text-muted-foreground">/ 1M tokens</span>
		</div>
	{/if}
</div>
