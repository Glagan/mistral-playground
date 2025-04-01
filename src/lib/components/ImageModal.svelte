<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();
</script>

{#if $modalStore[0]}
	<img
		src={$modalStore[0]?.image}
		alt={$modalStore[0]?.title}
		class="max-w-[90vw] max-h-[90vh] rounded-container-token overflow-hidden shadow-xl"
	/>
{/if}
