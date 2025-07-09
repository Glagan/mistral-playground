<script lang="ts">
	import { settings } from '$lib/stores/settings';
	import { chat } from '$lib/stores/chat.svelte';
	import { models } from '$lib/stores/models.svelte';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { tick } from 'svelte';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	function createNewChat() {
		chat.reset();
	}
</script>

<form class="flex h-full shrink grow flex-col gap-6 overflow-auto lg:w-[30vw]">
	<div class="flex w-full flex-col gap-1.5">
		<label for="topP" class="text-sm leading-none font-medium">Model</label>
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
											chat.state.options.model = item.id;
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
		<label for="topP" class="text-sm leading-none font-medium">
			Temperature
			{#if chat.state.options.temperature !== $settings.temperature}
				<Button variant="outline" size="sm" onclick={() => (chat.state.options.temperature = $settings.temperature)}>
					Reset
					<RotateCcwIcon />
				</Button>
			{/if}
		</label>
		<div class="flex flex-row gap-2">
			<Slider type="single" bind:value={chat.state.options.temperature} min={0} max={1} step={0.01} />
			<span class="w-10">{chat.state.options.temperature}</span>
		</div>
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<label for="topP" class="text-sm leading-none font-medium">
			Top P
			{#if chat.state.options.topP !== 1}
				<Button variant="outline" size="sm" onclick={() => (chat.state.options.topP = 1)}>
					Reset
					<RotateCcwIcon />
				</Button>
			{/if}
		</label>
		<div class="flex flex-row gap-2">
			<Slider type="single" id="topP" bind:value={chat.state.options.topP} min={0} max={1} step={0.01} />
			<span class="w-10">{chat.state.options.topP}</span>
		</div>
	</div>
	<div class="flex flex-row items-center justify-between rounded-lg border p-4">
		<div class="space-y-0.5">
			<label for="json_mode" class="text-sm leading-none font-medium">JSON</label>
			<div class="text-muted-foreground text-sm">
				Enables JSON mode, which guarantees the message the model generates is in JSON.<br />
				When using JSON mode you MUST also instruct the model to produce JSON yourself with a system or a user message.
			</div>
		</div>
		<Switch id="json_mode" bind:checked={chat.state.options.json} />
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<label for="topP" class="text-sm leading-none font-medium">
			Presence penalty
			{#if chat.state.options.presencePenalty !== 0}
				<Button variant="outline" size="sm" onclick={() => (chat.state.options.presencePenalty = 0)}>
					Reset
					<RotateCcwIcon />
				</Button>
			{/if}
		</label>
		<p class="text-muted-foreground text-sm">
			Determines how much the model penalizes the repetition of words or phrases.
		</p>
		<div class="flex flex-row gap-2">
			<Slider
				type="single"
				id="presencePenalty"
				bind:value={chat.state.options.presencePenalty}
				min={-2}
				max={2}
				step={0.01}
			/>
			<span class="w-10">{chat.state.options.presencePenalty}</span>
		</div>
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<label for="topP" class="text-sm leading-none font-medium">
			Frequency penalty
			{#if chat.state.options.frequencyPenalty !== 0}
				<Button variant="outline" size="sm" onclick={() => (chat.state.options.frequencyPenalty = 0)}>
					Reset
					<RotateCcwIcon />
				</Button>
			{/if}
		</label>
		<p class="text-muted-foreground text-sm">
			Penalizes the repetition of words based on their frequency in the generated text. A higher frequency penalty
			discourages the model from repeating words that have already appeared frequently in the output, promoting
			diversity and reducing repetition.
		</p>
		<div class="flex flex-row gap-2">
			<Slider
				type="single"
				id="frequencyPenalty"
				bind:value={chat.state.options.frequencyPenalty}
				min={-2}
				max={2}
				step={0.01}
			/>
			<span class="w-10">{chat.state.options.frequencyPenalty}</span>
		</div>
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<Label for="maxTokens">Max tokens</Label>
		<p class="text-muted-foreground text-sm">The maximum number of tokens to generate in the completion.</p>
		<Input
			id="maxTokens"
			type="number"
			placeholder="Max tokens"
			min="1"
			max={models.chat.find((model) => model.id === chat.state.options.model)?.maxContextLength ?? 32000}
			bind:value={chat.state.options.maxTokens}
		/>
	</div>
	<div class="flex w-full flex-col gap-1.5">
		<Label for="seed">Seed</Label>
		<p class="text-muted-foreground text-sm">
			The seed to use for random sampling. If set, different calls will generate deterministic results.
		</p>
		<Input id="seed" type="number" placeholder="Seed" bind:value={chat.state.options.seed} />
	</div>
	<div class="flex flex-row items-center justify-between rounded-lg border p-4">
		<div class="space-y-0.5">
			<label for="safePrompt" class="text-sm leading-none font-medium">Safe prompt</label>
			<div class="text-muted-foreground text-sm">Whether to inject a safety prompt before all conversations.</div>
		</div>
		<Switch id="safePrompt" bind:checked={chat.state.options.safePrompt} />
	</div>
	<Textarea rows={5} placeholder="System prompt" bind:value={chat.state.options.systemPrompt} />
	<Button class="mx-auto" onclick={createNewChat}>New chat</Button>
</form>
