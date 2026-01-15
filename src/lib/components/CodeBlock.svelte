<script lang="ts">
	import { Streamdown } from 'svelte-streamdown';
	import Code from 'svelte-streamdown/code';
	import Mermaid from 'svelte-streamdown/mermaid';
	import Math from 'svelte-streamdown/math';

	let { class: className, code, language }: { class?: string; code: string; language: string } = $props();

	let htmlCode = $state('');

	$effect(() => {
		if (code) {
			htmlCode = `\`\`\`${language}\n${code || ''}\n\`\`\``;
		}
	});
</script>

{#if htmlCode}
	<Streamdown
		content={htmlCode}
		class={className}
		baseTheme="shadcn"
		shikiTheme="github-dark"
		components={{ code: Code, mermaid: Mermaid, math: Math }}
		animation={{ enabled: true, type: 'fade' }}
	/>
{/if}
