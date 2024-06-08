<script lang="ts">
	import { onMount } from 'svelte';
	import { loadModels } from '$lib/stores/models.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { error } from '@sveltejs/kit';
	import type { ChatState } from '$lib/stores/chat.svelte';
	import Messages from '$lib/components/Messages.svelte';
	import type { Message } from '$lib/types';
	import MessageCircleQuestionIcon from 'lucide-svelte/icons/message-circle-question';
	import { v4 } from 'uuid';
	import TriangleAlertIcon from 'lucide-svelte/icons/triangle-alert';
	import BotIcon from 'lucide-svelte/icons/bot';

	const data = $page.data as PageData;

	if (!data) {
		error(400, 'Invalid shared link');
	}

	const chat: ChatState | null = data.chat
		? {
				id: v4(),
				messages: data.chat.m.map(
					(message): Message => ({
						id: v4(),
						type: message.t === 1 ? 'user' : message.t === 2 ? 'system' : 'assistant',
						index: 0,
						content: [message.c]
					})
				),
				options: {
					model: data.chat.o.m,
					temperature: data.chat.o.t ?? 1,
					topP: data.chat.o.tP ?? 1,
					maxTokens: data.chat.o.mT,
					randomSeed: data.chat.o.r,
					json: data.chat.o.j,
					safePrompt: data.chat.o.s ?? false
				}
			}
		: null;
	const chatError = null;

	onMount(() => {
		loadModels();
	});
</script>

<div
	class="flex flex-grow flex-shrink justify-center items-stretch flex-col gap-4 p-4 max-h-[calc(100vh-88px)] lg:max-h-screen"
>
	{#if chat}
		<Messages messages={chat.messages} loading={false} error={chatError} />
		<div class="alert flex-row items-center gap-3 variant-ghost-tertiary text-sm p-2 lg:p-4">
			<div>
				<MessageCircleQuestionIcon size={24} />
			</div>
			<div class="alert-message !mt-0">
				<h3 class="text-base">Shared chat</h3>
				<p>
					This chat was generated using the <a href="https://mistral.ai/" target="_blank" class="underline">Mistral</a>
					model
					<b>{chat.options.model}</b>.
				</p>
				<p>Be aware that this text could have been altered and not be the exact output of the model.</p>
			</div>
		</div>
	{:else}
		<div class="alert flex-row items-center gap-3 variant-ghost-error text-sm p-2 lg:p-4">
			<div>
				<TriangleAlertIcon size={24} />
			</div>
			<div class="alert-message !mt-0">
				<h3 class="text-xl">Failed to load shared chat</h3>
				<p>The chat data is corrupted.</p>
				<div class="flex flex-row gap-2 items-center">
					<a href="/" class="btn justify-start font-bold transition-all variant-ringed-primary disabled:opacity-75">
						<BotIcon class="flex-shrink-0" />
						<span class="truncate">Go back home</span>
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>
