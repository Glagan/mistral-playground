<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';

	let { item } = $props();
</script>

<Collapsible.Root open={item.isActive}>
	{#snippet child({ props })}
		<Sidebar.MenuItem {...props}>
			<Sidebar.MenuButton tooltipContent={item.title}>
				{#snippet child({ props })}
					<div {...props} onclick={toggleMode}>
						<SunIcon class="w-h-4 h-4 scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90" />
						<MoonIcon class="w-h-4 absolute h-4 scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0" />
						<span class="cursor-pointer">Toggle theme</span>
					</div>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	{/snippet}
</Collapsible.Root>
