<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { apiKey } from '$lib/stores/apiKey';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	let {
		title,
		items
	}: {
		title?: string;
		items: (
			| { title: string; component: any }
			| {
					title: string;
					url: string;
					// This should be `Component` after @lucide/svelte updates types
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					icon?: any;
					isActive?: boolean;
					items?: {
						title: string;
						url: string;
					}[];
					disableLoggedOut?: boolean;
					hideLoggedOut?: boolean;
			  }
		)[];
	} = $props();

	const sidebar = Sidebar.useSidebar();

	let loggedIn = $derived(!!$apiKey);
</script>

<Sidebar.Group>
	{#if title}
		<Sidebar.GroupLabel>{title}</Sidebar.GroupLabel>
	{/if}
	<Sidebar.Menu>
		{#each items as mainItem (mainItem.title)}
			{#if 'component' in mainItem}
				<mainItem.component item={mainItem} />
			{:else if loggedIn || !mainItem.hideLoggedOut}
				<Collapsible.Root open={mainItem.isActive}>
					{#snippet child({ props })}
						<Sidebar.MenuItem
							{...props}
							class={mainItem.disableLoggedOut && !loggedIn ? 'pointer-events-none opacity-50' : ''}
						>
							<Sidebar.MenuButton tooltipContent={mainItem.title}>
								{#snippet child({ props })}
									<a
										href={mainItem.url}
										target={mainItem.url.startsWith('http') ? '_blank' : undefined}
										{...props}
										onclick={() => sidebar.closeOnMedium()}
									>
										{#if mainItem.icon}
											<mainItem.icon />
										{/if}
										<span class="grow">{mainItem.title}</span>
										{#if mainItem.url.startsWith('http')}
											<ExternalLinkIcon />
										{/if}
									</a>
								{/snippet}
							</Sidebar.MenuButton>
							{#if mainItem.items?.length}
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuAction {...props} class="data-[state=open]:rotate-90">
											<ChevronRightIcon />
											<span class="sr-only">Toggle</span>
										</Sidebar.MenuAction>
									{/snippet}
								</Collapsible.Trigger>
								<Collapsible.Content>
									<Sidebar.MenuSub>
										{#each mainItem.items as subItem (subItem.title)}
											<Sidebar.MenuSubItem>
												<Sidebar.MenuSubButton href={subItem.url}>
													<span>{subItem.title}</span>
												</Sidebar.MenuSubButton>
											</Sidebar.MenuSubItem>
										{/each}
									</Sidebar.MenuSub>
								</Collapsible.Content>
							{/if}
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
