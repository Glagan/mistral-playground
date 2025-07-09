<script lang="ts">
	import { chat } from '$lib/stores/chat.svelte';
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import CodeIcon from '@lucide/svelte/icons/code';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import CodeBlock from '../CodeBlock.svelte';
	import Clipboard from '@lucide/svelte/icons/clipboard';

	let open = $state(false);

	const clientDefaults = {
		topP: 1,
		presencePenalty: 0,
		frequencyPenalty: 0,
		safePrompt: false
	};

	let code = $derived.by(() => {
		const options = {
			temperature: chat.state.options.temperature,
			topP: chat.state.options.topP,
			presencePenalty: chat.state.options.presencePenalty,
			frequencyPenalty: chat.state.options.frequencyPenalty,
			maxTokens: chat.state.options.maxTokens,
			safePrompt: chat.state.options.safePrompt,
			randomSeed: chat.state.options.seed,
			systemPrompt: chat.state.options.systemPrompt,
			responseFormat: undefined as undefined | string
		};
		if (chat.state.options.json) {
			options.responseFormat = "{ type: 'json_object' }";
		}
		const messageCopy = JSON.parse(
			JSON.stringify(chat.state.messages.map((m) => ({ role: m.role, content: m.versions[m.index].content })))
		);
		if (chat.state.options.systemPrompt) {
			messageCopy.unshift({ role: 'system', content: chat.state.options.systemPrompt });
		}
		if (messageCopy[messageCopy.length - 1]?.role === 'assistant') {
			messageCopy.splice(messageCopy.length - 1, 1);
		}
		const lines: string[] = [
			"import { Mistral } from '@mistralai/mistralai';",
			'',
			'const apiKey = process.env.MISTRAL_API_KEY;',
			`const model = "${chat.state.options.model}";`,
			'',
			'const client = new Mistral({ apiKey: apiKey });',
			'',
			'const chat = await client.chat.complete({',
			'    model,',
			Object.entries(options)
				.filter(
					([key, value]) =>
						key !== 'systemPrompt' &&
						value !== undefined &&
						(!(key in clientDefaults) || value !== clientDefaults[key as keyof typeof clientDefaults])
				)
				.map(([key, value]) => {
					return `\t${key}: ${value},`;
				})
				.join('\n'),
			`    messages: ${JSON.stringify(messageCopy, undefined, 4)}`,
			'});',
			''
		];
		return lines.join('\n');
	});

	async function copyCode() {
		await navigator.clipboard.writeText(code);
		toast.success('Code copied');
	}

	function close() {
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button variant="outline">
			<CodeIcon />
			<span class="hidden lg:inline">Export to code</span>
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="md:max-w-lg lg:max-w-3xl">
		<Dialog.Header>
			<Dialog.Title>Export chat to code</Dialog.Title>
		</Dialog.Header>
		<Tabs.Root value="javascript">
			<Tabs.List>
				<Tabs.Trigger value="javascript">Javascript</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="javascript">
				<div class="max-h-[384px] overflow-y-auto">
					<CodeBlock {code} language="javascript" />
				</div>
			</Tabs.Content>
		</Tabs.Root>
		<div class="flex flex-row items-center justify-center">
			<Button onclick={copyCode}>
				<Clipboard size={16} />
				<span>Copy code</span>
			</Button>
		</div>
		<Dialog.Footer>
			<Button onclick={() => close()}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
