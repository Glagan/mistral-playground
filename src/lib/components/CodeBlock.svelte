<script lang="ts">
	import { Streamdown } from 'svelte-streamdown';

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
		animation={{ enabled: true, type: 'fade' }}
	/>
{/if}
