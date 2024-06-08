<script lang="ts">
	import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
	import { chat, type SharedChatState } from '$lib/stores/chat.svelte';
	import { stringify } from 'devalue';
	import { compress } from '$lib/compress';
	import { joinURL } from 'ufo';

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	async function copyAndClose() {
		const sharedOptions: SharedChatState['o'] = {
			m: chat.state.options.model
		};
		if (typeof chat.state.options.temperature === 'number') {
			sharedOptions.t = chat.state.options.temperature;
		}
		if (typeof chat.state.options.topP === 'number') {
			sharedOptions.tP = chat.state.options.topP;
		}
		if (typeof chat.state.options.maxTokens === 'number' && chat.state.options.maxTokens > 0) {
			sharedOptions.mT = chat.state.options.maxTokens;
		}
		if (typeof chat.state.options.randomSeed === 'number') {
			sharedOptions.r = chat.state.options.randomSeed;
		}
		if (chat.state.options.json === true) {
			sharedOptions.j = true;
		}
		if (chat.state.options.safePrompt === true) {
			sharedOptions.s = true;
		}
		const shared: SharedChatState = {
			m: chat.state.messages.map((message) => {
				return {
					t: message.type === 'user' ? 1 : message.type === 'system' ? 2 : undefined,
					c: message.content[message.index]
				};
			}),
			o: sharedOptions
		};
		const stringified = stringify(shared);
		const compressed = btoa(await compress(stringified));
		const link = `${joinURL(window.location.host, 'share', compressed.replaceAll('/', '-'))}`;
		await navigator.clipboard.writeText(link);
		toastStore.trigger({
			classes: 'variant-filled-success',
			message: 'Link copied to clipboard'
		});
		modalStore.close();
	}
</script>

{#if $modalStore[0]}
	<div>
		<h2 class="text-xl">Share</h2>
		<div class="card variant-filled-surface p-4 flex flex-col gap-4">
			<div>Shared links can't be deleted.</div>
			<div>Your API key is safe and <b>not</b> included in the shared link.</div>
		</div>
		<div class="flex items-center justify-end gap-4 mt-2">
			<button type="button" class="flex-shrink-0 btn variant-ghost-primary" onclick={() => modalStore.close()}>
				Close
			</button>
			<button type="submit" class="flex-shrink-0 btn variant-filled-success" onclick={() => copyAndClose()}>
				Copy
			</button>
		</div>
	</div>
{/if}
