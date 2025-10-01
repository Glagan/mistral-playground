<script lang="ts">
	import type { OCRPageObject } from '@mistralai/mistralai/models/components';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Streamdown } from 'svelte-streamdown';

	let { page, loading }: { page: OCRPageObject; loading: boolean } = $props();

	const markdown = $derived.by(() => {
		let markdown = page.markdown;
		for (let index = 0; index < page.images.length; index++) {
			const image = page.images[index];
			markdown = markdown.replaceAll(`(${image.id})`, `(${image.imageBase64})`);
		}
		return markdown.trim();
	});
</script>

<div class="text-center">
	<div class="text-neutral-600">{page.index + 1}</div>
</div>

<Card.Root class="w-full gap-3 py-3">
	<Card.Content class="rendered-markdown relative max-w-full space-y-4 overflow-x-hidden px-3">
		<Streamdown
			content={markdown}
			baseTheme="shadcn"
			shikiTheme="github-dark"
			allowedImagePrefixes={['data:image/', '*']}
			class="space-y-4"
		/>
	</Card.Content>
</Card.Root>
