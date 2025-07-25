<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { setMode } from 'mode-watcher';
	import * as Select from '$lib/components/ui/select/index.js';

	let { item } = $props();

	function changeTheme(theme: string) {
		setMode(theme as 'light' | 'dark' | 'system');
	}
</script>

<Collapsible.Root open={item.isActive}>
	{#snippet child({ props })}
		<Sidebar.MenuItem {...props}>
			<Sidebar.MenuButton tooltipContent={item.title}>
				{#snippet child({ props })}
					<div {...props}>
						<SunIcon class="w-h-4 h-4 scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90" />
						<MoonIcon class="w-h-4 absolute h-4 scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0" />
						<Select.Root type="single" onValueChange={changeTheme}>
							<Select.Trigger
								class="data-[placeholder]:text-sidebar-foreground [&_svg:not([class*='text-'])]:text-sidebar-muted-foreground dark:text-sidebar-foreground border-0 bg-transparent p-0 dark:bg-transparent dark:hover:bg-transparent"
								>Select theme</Select.Trigger
							>
							<Select.Content>
								<Select.Item value="light">Light</Select.Item>
								<Select.Item value="dark">Dark</Select.Item>
								<Select.Item value="system">System</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	{/snippet}
</Collapsible.Root>
