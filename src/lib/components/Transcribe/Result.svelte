<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { TranscriptionSegmentChunk } from '@mistralai/mistralai/models/components';
	import { Duration } from 'luxon';

	let { text, segments }: { text: string; segments: TranscriptionSegmentChunk[] } = $props();

	function toFormattedTimestamp(seconds: number) {
		return Duration.fromObject({ seconds }).toFormat('hh:mm:ss');
	}
</script>

<div id="text-container" class="flex w-full shrink grow flex-col gap-4 overflow-auto">
	{#if text.length > 0}
		<Card.Root class="w-full gap-3 py-3">
			<Card.Content class="rendered-markdown relative max-w-full space-y-4 overflow-x-hidden px-3 whitespace-pre-wrap"
				>{text}</Card.Content
			>
		</Card.Root>
	{/if}
	{#if segments.length}
		<div class="flex flex-col gap-3 xl:gap-2">
			{#each segments as segment}
				<div class="flex flex-col gap-1 xl:flex-row xl:gap-4">
					<span class="text-muted-foreground shrink-0 grow-0"
						>{toFormattedTimestamp(segment.start)} - {toFormattedTimestamp(segment.end)}</span
					>
					<div class="grow">{segment.text}</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
