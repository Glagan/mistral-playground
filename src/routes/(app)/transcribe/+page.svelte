<script lang="ts">
	import { apiKey } from '$lib/stores/apiKey';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import { onMount } from 'svelte';
	import { transcribe } from '$lib/stores/transcribe.svelte';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import { loadModels, models } from '$lib/stores/models.svelte';
	import { getClientForRequest } from '$lib/mistral';
	import ModelError from '$lib/components/ModelError.svelte';
	import prettyBytes from 'pretty-bytes';
	import { mimeTypesAcceptTranscribe } from '$lib/files';
	import { db } from '$lib/stores/db';
	import { toast } from 'svelte-sonner';
	import { FileDropZone, MEGABYTE, type FileDropZoneProps } from '$lib/components/ui/file-drop-zone';
	import Button from '$lib/components/ui/button/button.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Options from './Options.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import TranscribeResult from '$lib/components/Transcribe/Result.svelte';
	import { Duration } from 'luxon';

	if (browser && !$apiKey) {
		goto('/', { replaceState: true });
	}

	let files = $state<File[] | undefined>(undefined);
	let error: { text: string; body?: object } | null = $state(null);

	$effect(() => {
		transcribe.state.id;
		error = null;
	});

	async function updateOrInsertHistory() {
		await db.transcribe.put({
			id: transcribe.state.id,
			filename: transcribe.state.filename,
			text: transcribe.state.text,
			segments: JSON.parse(JSON.stringify(transcribe.state.segments)),
			language: transcribe.state.language,
			usage: transcribe.state.usage ? JSON.parse(JSON.stringify(transcribe.state.usage)) : undefined,
			options: JSON.parse(JSON.stringify(transcribe.state.options))
		});
	}

	let loading = $state(false);
	let abortController: AbortController | null = null;

	async function generate(file: File) {
		error = null;
		transcribe.resetResult();

		if (file.size > 50 * 1024 * 1024) {
			toast.info('File size should be less than 50MB.');
			return;
		}

		const outputNode = document.getElementById('pages-container');
		loading = true;

		abortController = new AbortController();
		try {
			const client = getClientForRequest({ apiKey: $apiKey, endpoint: $settings.endpoint });
			const transcribeResponse = await client.audio.transcriptions.complete(
				{
					model: transcribe.state.options.model,
					file: {
						fileName: file.name,
						content: await file.arrayBuffer()
					},
					language: transcribe.state.options.language,
					timestampGranularities: transcribe.state.options.timestampGranularities ? ['segment'] : [],
					temperature: transcribe.state.options.temperature
				},
				{ fetchOptions: { signal: abortController.signal } }
			);
			transcribe.state.filename = file.name;
			transcribe.state.text = transcribeResponse.text;
			transcribe.state.segments = transcribeResponse.segments ?? [];
			transcribe.state.language = transcribeResponse.language;
			transcribe.state.usage = transcribeResponse.usage;
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
			files = undefined;
			await updateOrInsertHistory();
		} catch (__error) {
			const _error = __error as Error;
			// Ignore abort errors
			if (_error.name !== 'AbortError') {
				const responseBody = _error.message.match(/([\s\S]+?)({[\s\S]+?})/is);
				if (responseBody) {
					try {
						const body = JSON.parse(responseBody[2].trim());
						error = { text: `Failed to generate: ${responseBody[1].trim()}`, body };
					} catch (jsonError) {
						error = { text: `Failed to generate: ${_error.message}` };
					}
				} else {
					error = { text: `Failed to generate: ${_error.message}` };
				}
			}
		} finally {
			loading = false;
		}
	}

	const onUpload: FileDropZoneProps['onUpload'] = async (uploadedFiles) => {
		files = uploadedFiles;
	};

	async function onSubmit(event: Event) {
		if (files?.length) {
			const outputNode = document.getElementById('pages-container');
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
			await generate(files[0]);
		}
	}

	async function stopGenerating(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		loading = false;
		abortController?.abort();
	}

	onMount(() => {
		loadModels();
	});
</script>

<div class="flex max-h-[calc(100svh-80px)] shrink grow flex-row gap-0">
	<Options class="hidden lg:flex" />
	<div class="relative flex h-full w-[calc(75vw-4rem-var(--sidebar-width))] flex-1 flex-col gap-4">
		<div class="flex-1 overflow-y-auto lg:px-4">
			<!-- {JSON.stringify(transcribe.state)} -->
			{#if transcribe.state.text.length || transcribe.state.segments.length}
				<TranscribeResult text={transcribe.state.text} segments={transcribe.state.segments} {error} />
			{:else}
				<div class="flex w-full shrink grow items-center justify-center overflow-auto"></div>
			{/if}
		</div>
		<form class="flex shrink-0 flex-col gap-2" onsubmit={onSubmit}>
			<ModelError />
			<label class="flex flex-col gap-1.5">
				<div class="flex items-center justify-between gap-2">
					<div class="flex items-center gap-2 truncate">
						{#if transcribe.state.usage}
							<div class="text-primary-500 flex items-center gap-2 text-right text-xs opacity-75">
								{#if transcribe.state.usage.promptAudioSeconds}
									<Badge>Audio</Badge>
									<div>
										<span class="text-primary-400"
											>{Duration.fromObject({ seconds: transcribe.state.usage.promptAudioSeconds })
												.rescale()
												.toHuman()
												.replace(/,/g, '')}</span
										>
									</div>
								{/if}
								<Badge>Tokens</Badge>
								<div>
									Prompt: <span class="text-muted-background">{transcribe.state.usage.promptTokens}</span> / Completion:
									<span class="text-muted-background">{transcribe.state.usage.completionTokens}</span>
									/ Total: <span class="text-muted-background">{transcribe.state.usage.totalTokens}</span>
								</div>
							</div>
						{/if}
						{#if transcribe.state.filename}
							<div class="text-primary-500 truncate text-xs" title={transcribe.state.filename}>
								{transcribe.state.filename}
							</div>
						{/if}
					</div>
				</div>
				{#if !files?.length}
					<FileDropZone
						{onUpload}
						name="files"
						maxFiles={1}
						maxFileSize={10 * MEGABYTE}
						accept={mimeTypesAcceptTranscribe}
						fileCount={files?.length ?? 0}
					/>
				{:else}
					{@const file = files[0]}
					<div
						class="border-border hover:bg-accent/25 flex h-48 w-full flex-row place-items-center items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-all"
					>
						<div class="shrink-0 grow-0">
							<FileTextIcon size="48" />
						</div>
						<div class="flex shrink grow flex-col gap-1">
							<div class="font-bold">{file.name}</div>
							<div>{prettyBytes(file.size)}</div>
						</div>
						<div>
							<Button type="reset" variant="destructive" disabled={loading} onclick={() => (files = undefined)}>
								Remove file
							</Button>
						</div>
					</div>
				{/if}
			</label>
			<div class="flex flex-row justify-between gap-2 lg:justify-end">
				<Drawer.Root direction="right">
					<Drawer.Trigger class="block lg:hidden" type="button" onclick={(event) => event.stopImmediatePropagation()}>
						<SlidersHorizontalIcon size={20} />
					</Drawer.Trigger>
					<Drawer.Content class="flex max-h-screen overflow-auto p-4">
						<Options />
					</Drawer.Content>
				</Drawer.Root>
				{#if loading}
					<Button variant="destructive" type="button" onclick={stopGenerating}>Stop</Button>
				{:else}
					<Button type="submit" disabled={loading || models.loading || !!models.error || !files?.length}>Submit</Button>
				{/if}
			</div>
		</form>
	</div>
</div>
