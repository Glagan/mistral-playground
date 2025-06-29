<script lang="ts">
	import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
	import { onMount } from 'svelte';

	let { code, language }: { code: string; language: BundledLanguage } = $props();

	let highlighter = $state<HighlighterGeneric<BundledLanguage, BundledTheme> | null>(null);
	let htmlCode = $state('');

	onMount(async () => {
		highlighter = await createHighlighter({
			themes: ['github-dark'],
			langs: [language]
		});
	});

	$effect(() => {
		if (highlighter && code) {
			htmlCode = highlighter.codeToHtml(code, { theme: 'github-dark', lang: language });
		}
	});
</script>

{#if htmlCode}
	{@html htmlCode}
{/if}
<p class="break-words whitespace-pre-wrap"></p>
