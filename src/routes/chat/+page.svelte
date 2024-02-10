<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { SlideToggle, focusTrap } from '@skeletonlabs/skeleton';
	import { get_encoding } from 'tiktoken';
	import { apiKey } from '$lib/stores/apiKey';
	import type { Answer, Question, Usage } from '$lib/types';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { history } from '$lib/stores/history';
	import Messages from '$lib/components/Messages.svelte';
	import { settings } from '$lib/stores/settings';
	import { onDestroy, tick } from 'svelte';
	import { current } from '$lib/stores/current.svelte';
	import hljs from 'highlight.js/lib/core';
	import { v4 as uuid } from 'uuid';

	if (browser && !$apiKey) {
		goto('/');
	}

	const encoding = get_encoding('cl100k_base');

	let showOptions = $state(false);
	let promptText = $state('');

	const unsubscribe = settings.subscribe((value) => {
		if ($current.state.messages.length === 0) {
			$current.state.options.temperature = value.temperature;
			$current.state.options.randomSeed = value.seed;
		}
	});

	function messageOrderIsValid(messages: (Question | Answer)[]) {
		if (messages.length === 0) {
			return true;
		}
		return messages.every((message, index) => {
			if (index === 0) {
				return message.type === 'user' || message.type === 'system';
			}
			return true;
		});
	}

	const tokens = $derived(encoding.encode(promptText).length);
	let systemPrompt = $state('');
	const systemPromptTokens = $derived(encoding.encode(systemPrompt).length);
	const stateIsValid = $derived(tokens <= 32000 && messageOrderIsValid($current.state.messages));

	function removeFromHistory() {
		$history = $history.filter((e) => e.id !== $current.state.id);
		$history = $history;
	}

	function updateOrInsertHistory() {
		$history = $history.filter((e) => e.id !== $current.state.id);
		$history.splice(0, 0, {
			id: $current.state.id,
			messages: JSON.parse(JSON.stringify($current.state.messages)),
			options: JSON.parse(JSON.stringify($current.state.options))
		});
		$history = $history;
	}

	let loading = $state(false);
	let keepGenerating = $state(true);
	let currentStream: ReadableStream | null = null;

	async function generate(messages: (Question | Answer)[], answer: Question | Answer) {
		loading = true;
		showOptions = false;
		keepGenerating = true;

		let response: Response;
		try {
			response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apiKey: $apiKey,
					messages: messages.map((message) => ({
						type: message.type,
						content: message.content[message.index]
					})),
					options: $current.state.options
				})
			});
		} catch (_error) {
			console.error(_error);
			answer.type = 'error';
			answer.content[answer.index] = `Failed to send request: ${_error}`;
			return;
		}

		if (!response.ok) {
			const rawBody = await response.text();
			answer.type = 'error';
			try {
				const body = JSON.parse(rawBody) as {
					error: any;
					message?: string;
					code: 'ERR_PARSING' | 'ERR_API_KEY' | 'ERR_API_REQ';
				};
				if (body.code === 'ERR_PARSING') {
					answer.content[answer.index] =
						`Failed to send request:\n${body.error.issues.map((issue: { message: string }) => issue.message).join('\n')}`;
				} else if (body.code === 'ERR_API_KEY') {
					answer.content[answer.index] = 'Your API key is invalid.';
				} else if (body.code === 'ERR_API_REQ') {
					if (body.message) {
						try {
							const asJson = JSON.parse(body.message);
							answer.content[answer.index] =
								`Request failed:\n\`\`\`json\n${JSON.stringify(asJson, undefined, 4)}\n\`\`\``;
							tick().then(() => hljs.highlightAll());
						} catch (error) {
							answer.content[answer.index] = `Your request is invalid: ${body.message}`;
						}
					} else {
						answer.content[answer.index] = 'Your request is invalid.';
					}
				}
			} catch (error) {
				answer.content[answer.index] =
					`Failed to send request: ${response.status} ${response.statusText}`;
			} finally {
				currentStream = null;
				loading = false;
				keepGenerating = false;
			}
			updateOrInsertHistory();
			return;
		}

		try {
			// Read each chunk and update the last response reference
			currentStream = response.body;
			const reader = response.body?.pipeThrough(new TextDecoderStream()).getReader();
			const outputNode = document.getElementById('messages-container');
			while (reader && keepGenerating) {
				const { value, done } = await reader.read();
				if (done) break;
				if (/^#/.test(value)) {
					const usage = JSON.parse(value.slice(1)) as Usage;
					(answer as Answer).usage = usage;
				} else {
					answer.content[answer.index] += value ?? '';
				}
				if (outputNode) {
					outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
				}
				hljs.highlightAll();
			}
			// Remove embedded usage that's stuck to the end if the string was received in a single event or was attached to another one
			const embeddedUsage = answer.content[answer.index].match(/#({.+?})$/);
			if (embeddedUsage) {
				answer.content[answer.index] = answer.content[answer.index].replace(/#({.+?})$/, '');
				(answer as Answer).usage = JSON.parse(embeddedUsage[1]) as Usage;
			}
			if (outputNode) {
				outputNode.scroll({ top: outputNode.scrollHeight, behavior: 'smooth' });
			}
			updateOrInsertHistory();
		} catch (error) {
			console.error(error);
			answer.type = 'error';
			answer.content[answer.index] = `Failed to generate: ${error}`;
		} finally {
			currentStream = null;
			loading = false;
			keepGenerating = false;
		}
	}

	async function onSubmit(event: Event) {
		event.preventDefault();
		if (systemPrompt) {
			$current.state.messages.push({
				id: uuid(),
				type: 'system',
				index: 0,
				content: [systemPrompt]
			});
		}
		if (promptText.length) {
			$current.state.messages.push({
				id: uuid(),
				type: 'user',
				index: 0,
				content: [promptText]
			});
		}
		promptText = '';

		// Take the messages up to here for the next generation
		const messagesToSend = JSON.parse(JSON.stringify($current.state.messages));

		const answer = $state<Question | Answer>({
			id: uuid(),
			type: 'assistant',
			index: 0,
			content: [''],
			usage: undefined
		});
		$current.state.messages.push(answer);

		await generate(messagesToSend, answer);
	}

	async function addSystemPrompt(event: Event) {
		event.preventDefault();
		if (systemPrompt) {
			$current.state.messages.push({
				id: uuid(),
				type: 'system',
				index: 0,
				content: [systemPrompt]
			});
			systemPrompt = '';
			showOptions = false;
		}
	}

	async function stopGenerating(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		keepGenerating = false;
		if (currentStream && !currentStream.locked) {
			currentStream.cancel();
		}
	}

	function resetSession(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		$current.reset();
		showOptions = false;
		promptText = '';
	}

	// * > Message events

	function moveUp(message: Question | Answer) {
		const index = $current.state.messages.findIndex((m) => m.id === message.id);
		if (index > 0) {
			$current.state.messages.splice(index, 1);
			$current.state.messages.splice(index - 1, 0, message);
			updateOrInsertHistory();
		}
	}

	function moveDown(message: Question | Answer) {
		const index = $current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0 && index < $current.state.messages.length - 1) {
			$current.state.messages.splice(index, 1);
			$current.state.messages.splice(index + 1, 0, message);
			updateOrInsertHistory();
		}
	}

	async function refresh(message: Question | Answer) {
		const index = $current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			const message = $current.state.messages[index];
			message.content.push('');
			message.index = message.content.length - 1;

			// Take the messages up to the answer we need to re-generate
			const messagesToSend = JSON.parse(JSON.stringify($current.state.messages.slice(0, index)));

			await generate(messagesToSend, message);
		}
	}

	async function previousVersion(message: Question | Answer) {
		const index = $current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			if ($current.state.messages[index].index > 0) {
				$current.state.messages[index].index = $current.state.messages[index].index - 1;
				updateOrInsertHistory();
			}
		}
	}

	async function nextVersion(message: Question | Answer) {
		const index = $current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			if (
				$current.state.messages[index].index <
				$current.state.messages[index].content.length - 1
			) {
				$current.state.messages[index].index = $current.state.messages[index].index + 1;
				updateOrInsertHistory();
			}
		}
	}

	async function deleteVersion(message: Question | Answer) {
		const index = $current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			$current.state.messages[index].content.splice($current.state.messages[index].index);
			if (
				$current.state.messages[index].index >=
				$current.state.messages[index].content.length - 1
			) {
				$current.state.messages[index].index -= 1;
			}
			updateOrInsertHistory();
		}
	}

	function updateMessage(message: Question | Answer, content: string) {
		const index = $current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			$current.state.messages[index].content[message.index] = content;
			updateOrInsertHistory();
		}
	}

	function deleteMessage(message: Question | Answer) {
		const index = $current.state.messages.findIndex((m) => m.id === message.id);
		if (index >= 0) {
			$current.state.messages.splice(index, 1);
			if ($current.state.messages.length === 0) {
				removeFromHistory();
			} else {
				updateOrInsertHistory();
			}
		}
	}

	// * < Message events

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class="flex justify-center items-stretch flex-col gap-4 p-4 max-h-screen">
	{#if $current.state.messages.length}
		<Messages
			bind:messages={$current.state.messages}
			interactive
			{moveUp}
			{moveDown}
			{refresh}
			{previousVersion}
			{nextVersion}
			{deleteVersion}
			{updateMessage}
			{deleteMessage}
		/>
		{#if loading && keepGenerating}
			<button
				class="btn variant-ghost-error transition-all mx-auto"
				type="button"
				transition:slide={{ axis: 'y' }}
				onclick={stopGenerating}
			>
				Stop
			</button>
		{/if}
	{:else}
		<div class="flex justify-center items-center flex-grow flex-shrink w-full overflow-auto">
			<span class="text-sm text-surface-200 text-opacity-75 italic">Messages will appear here</span>
		</div>
	{/if}
	<form class="flex flex-col gap-2 flex-shrink-0" use:focusTrap={true} onsubmit={onSubmit}>
		{#if !stateIsValid}
			<aside class="alert variant-ghost-error" transition:slide={{ axis: 'y' }}>
				<div class="alert-message">
					<p>
						Your input is invalid, the first message can only be a system prompt or a question and
						the last message must be a question or system prompt.
					</p>
				</div>
			</aside>
		{/if}
		<label class="label">
			<div class="flex justify-between items-center">
				<span>Prompt</span>
				{#if tokens > 0}
					<span class="text-xs" transition:fade>
						~<span class="text-surface-300">{tokens}</span> tokens
					</span>
				{/if}
			</div>
			<textarea
				bind:value={promptText}
				class="textarea"
				rows="4"
				placeholder="Type something..."
				data-focusindex="0"
			/>
		</label>
		<div class="flex flex-row justify-between">
			<button
				class="btn variant-ghost-surface"
				type="button"
				disabled={loading}
				onclick={(event) => {
					event.preventDefault();
					return (showOptions = !showOptions);
				}}
			>
				Options
			</button>
			{#if $current.state.messages.length}
				<button
					class="btn variant-ghost-warning transition-all"
					disabled={loading}
					type="button"
					transition:fade={{ duration: 200 }}
					onclick={resetSession}>New session</button
				>
			{/if}
			<button
				type="submit"
				class="btn variant-filled-primary transition-all"
				disabled={loading ||
					(!promptText &&
						$current.state.messages[$current.state.messages.length - 1]?.type !== 'user')}
			>
				Submit
			</button>
		</div>
		{#if showOptions}
			<div class="flex flex-col gap-2" transition:slide={{ axis: 'y' }}>
				<div class="flex flex-row justify-between gap-2 items-center *:max-w-[30%]">
					<select bind:value={$current.state.options.model} class="select flex-grow-0">
						<option value="mistral-tiny">Mistral Tiny</option>
						<option value="mistral-small">Mistral Small</option>
						<option value="mistral-medium">Mistral Medium</option>
					</select>
					<label class="flex-shrink-0">
						<div class="flex flex-row justify-between items-center">
							<span>Temperature</span>
							<span class="text-surface-300">{$current.state.options.temperature}</span>
						</div>
						<input
							bind:value={$current.state.options.temperature}
							type="range"
							name="temperature"
							id="temperature"
							min="0"
							max="1"
							step="0.01"
							placeholder="Temperature"
						/>
					</label>
					<label class="flex-shrink-0">
						<div class="flex flex-row justify-between items-center">
							<span>Top P</span>
							<span class="text-surface-300">{$current.state.options.topP}</span>
						</div>
						<input
							bind:value={$current.state.options.topP}
							type="range"
							name="topP"
							id="topP"
							min="0"
							max="1"
							step="0.01"
							placeholder="Top P"
						/>
					</label>
				</div>
				<div class="flex flex-row justify-between gap-2 items-center *:max-w-[30%]">
					<input
						bind:value={$current.state.options.maxTokens}
						class="input"
						type="number"
						name="maxTokens"
						id="maxTokens"
						min="1"
						max="32000"
						placeholder="Max tokens"
					/>
					<input
						bind:value={$current.state.options.randomSeed}
						class="input"
						type="number"
						name="randomSeed"
						id="randomSeed"
						placeholder="Seed"
					/>
					<div class="flex-shrink-0 cursor-pointer">
						<SlideToggle name="safePrompt" bind:checked={$current.state.options.safePrompt}>
							Safe prompt
						</SlideToggle>
					</div>
				</div>
				<label class="label">
					<div class="flex justify-between items-center">
						<span>System prompt</span>
						{#if systemPromptTokens > 0}
							<span class="text-xs" transition:fade>
								~<span class="text-surface-300">{systemPromptTokens}</span> tokens
							</span>
						{/if}
					</div>
					<textarea
						bind:value={systemPrompt}
						class="textarea"
						name="system"
						id="system"
						placeholder="System prompt"
						rows="4"
					></textarea>
				</label>
				<button
					type="button"
					class="btn variant-filled-primary transition-all ml-auto"
					disabled={loading || !systemPrompt}
					onclick={addSystemPrompt}
				>
					Add system prompt
				</button>
			</div>
		{/if}
	</form>
</div>
