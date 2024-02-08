<script lang="ts">
	import type { Answer, Question } from '$lib/types';

	let { message } = $props<{
		message: Question | Answer;
	}>();

	let showOptions = $state(false);
</script>

<div class="flex flex-row flex-nowrap">
	{#if message.type === 'answer'}
		<div class="flex-grow flex-shrink-0 w-[60%] max-w-[60%] ml-auto">
			<p class="text-xs opacity-75 text-right text-primary-500">Answer</p>
			<div class="card p-4 variant-ghost-primary whitespace-pre-wrap cursor-pointer">
				{message.content}
			</div>
			{#if message.usage}
				<p class="text-xs opacity-75 text-right text-primary-500">
					Prompt: <span class="text-primary-400">{message.usage.prompt_tokens}</span> / Completion:
					<span class="text-primary-400">{message.usage.completion_tokens}</span>
					/ Total: <span class="text-primary-400">{message.usage.total_tokens}</span>
				</p>
			{/if}
		</div>
	{:else if message.type === 'question'}
		<div class="flex-grow flex-shrink-0 w-[60%] max-w-[60%]">
			<p class="text-xs opacity-75 text-secondary-300">Question</p>
			<div class="card p-4 variant-ghost-secondary whitespace-pre-wrap">
				{message.content}
			</div>
		</div>
	{:else if message.type === 'error'}
		<div class="flex-grow flex-shrink-0 w-[60%] max-w-[60%] ml-auto">
			<p class="text-xs opacity-75 text-error-300">Error</p>
			<div class="card p-4 variant-ghost-error whitespace-pre-wrap">
				{message.content}
			</div>
		</div>
	{:else}
		<div class="w-full">
			<p class="text-xs opacity-75 text-tertiary-300">System</p>
			<div class="card p-4 variant-ghost-tertiary whitespace-pre-wrap">
				{message.content}
			</div>
		</div>
	{/if}
</div>
