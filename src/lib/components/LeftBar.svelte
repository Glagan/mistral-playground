<script lang="ts">
	import { MenuIcon } from 'lucide-svelte';
	import Navigation from './Navigation.svelte';
	import { getDrawerStore, type DrawerSettings } from '@skeletonlabs/skeleton';

	const drawerStore = getDrawerStore();

	function openNavigationDrawer() {
		const drawerSettings: DrawerSettings = {
			id: 'navigation',
			bgDrawer: 'bg-surface-900 text-white',
			bgBackdrop: 'bg-gradient-to-tr from-surface-500/50 via-primary-500/50 to-secondary-500/50',
			width: 'w-[320px] md:w-[540px]',
			padding: 'p-4',
			rounded: 'rounded-xl',
			position: 'right'
		};
		drawerStore.open(drawerSettings);
	}
</script>

<div
	class="flex lg:flex-col flex-grow-0 flex-shrink-0 h-full justify-between lg:justify-normal items-center lg:items-start p-4 gap-4 max-h-screen overflow-auto"
>
	<img class="block max-h-14 lg:max-h-max lg:mx-auto" src="/logo-dark.webp" alt="Mistral Playground" />
	<div class="flex lg:hidden flex-col items-center gap-2">
		<button type="button" class="transition-all font-bold text-lg" onclick={openNavigationDrawer}>
			<MenuIcon size={40} />
		</button>
	</div>
	<Navigation isFromRoot />
</div>

<style>
</style>
