<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();
</script>

{#if $modalStore[0]}
	<img
		src={$modalStore[0]?.image}
		class="max-w-[90vw] max-h-[90vh] rounded-container-token overflow-hidden shadow-xl"
	/>
{/if}
