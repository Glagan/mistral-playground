<script lang="ts">
	import { slide } from 'svelte/transition';
	import { focusTrap, FileDropzone, getToastStore } from '@skeletonlabs/skeleton';
	import { apiKey } from '$lib/stores/apiKey';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { history } from '$lib/stores/history';
	import { settings } from '$lib/stores/settings';
	import { onMount } from 'svelte';
	import { ocr } from '$lib/stores/ocr.svelte';
	import Settings2Icon from 'lucide-svelte/icons/settings-2';
	import FileTextIcon from 'lucide-svelte/icons/file-text';
	import { loadModels, models } from '$lib/stores/models.svelte';
	import { getClientForRequest } from '$lib/mistral';
	import ModelError from '$lib/components/ModelError.svelte';
	import { defaultChatModel } from '$lib/const';
	import PdfPages from '$lib/components/PdfPages.svelte';
	import prettyBytes from 'pretty-bytes';
	import { fileToB64 } from '$lib/files';

	if (browser && !$apiKey) {
		goto('/', { replaceState: true });
	}

	const toastStore = getToastStore();

	let files = $state<FileList | undefined>(undefined);
	let showOptions = $state(false);
	let error: { text: string; body?: object } | null = $state(null);

	$effect(() => {
		ocr.state.id;
		error = null;
	});

	function updateOrInsertHistory() {
		$history.ocr = $history.ocr.filter((e) => e.id !== ocr.state.id);
		$history.ocr.splice(0, 0, {
			id: ocr.state.id,
			filename: ocr.state.filename,
			pages: JSON.parse(JSON.stringify(ocr.state.pages)),
			usage: ocr.state.usage ? JSON.parse(JSON.stringify(ocr.state.usage)) : undefined,
			options: JSON.parse(JSON.stringify(ocr.state.options))
		});
		$history.ocr = $history.ocr;
	}

	let loading = $state(false);
	let abortController: AbortController | null = null;

	async function generate(file: File) {
		error = null;
		ocr.reset();

		if (file.size > 50 * 1024 * 1024) {
			toastStore.trigger({ message: 'File size should be less than 50MB.' });
			return;
		}

		const outputNode = document.getElementById('pages-container');
		loading = true;
		showOptions = false;

		const b64File = await fileToB64(file);

		abortController = new AbortController();
		const startedAt = performance.now();
		try {
			const client = getClientForRequest({ apiKey: $apiKey, endpoint: $settings.endpoint });
			const ocrResponse = await client.ocr.process(
				{
					model: ocr.state.options.model ? ocr.state.options.model : defaultChatModel,
					document: file.type.includes('image')
						? { imageUrl: b64File, type: 'image_url' }
						: { documentUrl: b64File, type: 'document_url' },
					includeImageBase64: true
				},
				{ fetchOptions: { signal: abortController.signal } }
			);
			ocr.state.filename = file.name;
			ocr.state.pages = ocrResponse.pages;
			ocr.state.usage = ocrResponse.usageInfo;
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
			files = undefined;
			updateOrInsertHistory();
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

<div
	class="flex flex-grow flex-shrink justify-center items-stretch flex-col gap-4 p-4 max-h-[calc(100vh-88px)] lg:max-h-screen"
>
	{#if ocr.state.pages.length}
		<PdfPages pages={ocr.state.pages} {loading} {error} />
	{:else}
		<div class="flex justify-center items-center flex-grow flex-shrink w-full overflow-auto"></div>
	{/if}
	{#if loading}
		<button
			class="btn variant-ghost-error transition-all mx-auto"
			type="button"
			transition:slide={{ axis: 'y' }}
			onclick={stopGenerating}
		>
			Stop
		</button>
	{/if}
	<form class="flex flex-col gap-2 flex-shrink-0" use:focusTrap={true} onsubmit={onSubmit}>
		<ModelError />
		<label class="label">
			<div class="flex justify-between items-center gap-2">
				<div class="flex items-center gap-2 truncate">
					{#if ocr.state.options.model}
						<div class="flex items-center gap-2 text-xs opacity-75 text-right text-primary-500">
							<span class="badge variant-soft-secondary">Model</span>
							<div>{ocr.state.options.model}</div>
						</div>
					{/if}
					{#if ocr.state.usage}
						<div class="flex items-center gap-2 text-xs opacity-75 text-right text-primary-500">
							<span class="badge variant-soft-secondary">Document</span>
							<div>
								Pages: <span class="text-primary-400">{ocr.state.usage.pagesProcessed}</span>
							</div>
						</div>
					{/if}
					{#if ocr.state.filename}
						<div class="text-xs text-primary-500 truncate" title={ocr.state.filename}>{ocr.state.filename}</div>
					{/if}
				</div>
			</div>
			{#if !files?.length}
				<FileDropzone
					bind:files
					name="files"
					multiple={false}
					accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
				>
					<svelte:fragment slot="lead">
						<FileTextIcon class="mx-auto" size="32" />
					</svelte:fragment>
					<svelte:fragment slot="message">
						<span class="label-text"><strong>Upload a file</strong> or drag and drop</span>
					</svelte:fragment>
					<svelte:fragment slot="meta">
						<span>PDF and images (.png, .jpeg, .jpg and .webp) allowed.</span>
					</svelte:fragment>
				</FileDropzone>
			{:else}
				{@const file = files[0]}
				<div
					class="dropzone textarea relative flex flex-row gap-2 items-center border-2 border-dashed !border-primary-500 p-4 py-4 rounded-container-token"
				>
					<div class="flex-grow-0 flex-shrink-0">
						<FileTextIcon size="48" />
					</div>
					<div class="flex flex-col gap-1 flex-grow flex-shrink">
						<div class="font-bold">{file.name}</div>
						<div>{prettyBytes(file.size)}</div>
					</div>
					<div>
						<button type="reset" class="btn variant-ghost-error" disabled={loading} onclick={() => (files = undefined)}>
							Remove file
						</button>
					</div>
				</div>
			{/if}
		</label>
		<div class="flex flex-row justify-between">
			<button
				class="btn variant-ghost-surface"
				type="button"
				disabled={loading || !!models.error}
				onclick={(event) => {
					event.preventDefault();
					return (showOptions = !showOptions);
				}}
			>
				<Settings2Icon size={20} />
				<span>Options</span>
			</button>
			<div class="flex flex-row gap-2">
				<!-- {#if ocr.state.messages.length}
					<button type="button" class="btn variant-ghost-secondary mx-auto" onclick={() => openShare()}>Share</button>
				{/if} -->
				<button
					type="submit"
					class="btn variant-filled-primary transition-all"
					disabled={loading || models.loading || !!models.error || !files?.length}
				>
					Submit
				</button>
			</div>
		</div>
		{#if showOptions}
			<div class="flex flex-col gap-2" transition:slide={{ axis: 'y' }}>
				<div class="grid grid-cols-3 gap-2">
					<div class="flex items-center gap-1">
						<select bind:value={ocr.state.options.model} class="select flex-grow-0" disabled={models.loading}>
							{#each Object.entries(models.ocrGroups) as [groupName, items]}
								<optgroup label={groupName}>
									{#each items as item}
										<option value={item.id}>{item.id}</option>
									{/each}
								</optgroup>
							{/each}
						</select>
					</div>
				</div>
			</div>
		{/if}
	</form>
</div>
