<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index';
	import {
		Settings2,
		User,
		Home,
		Book,
		LibraryBig,
		BookMarked,
		Stamp,
		MessageSquare,
		MessageSquareDashed,
		MessagesSquare,
		SquareLibrary,
		History,
		SwatchBook,
		SquareChartGantt,
		Import,
		Dices,
		Users,
		Logs,
		ShieldBan,
		Flag,
		UserPen,
		Gem
	} from 'lucide-svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import { onMount } from 'svelte';
	import { api } from '$lib/base/api';

	let groupedItems: any = $state([]);

	onMount(async () => {
		const currentUser = await api.vrckit.users.current.fetch().catch(() => null);
		const flags = currentUser?.system_flags || [];
		groupedItems = Object.entries(
			Object.groupBy(
				[
					{
						category: 'General',
						title: 'Premium',
						url: '/premium',
						glowing: true,
						icon: Gem
					},
					{
						category: 'General',
						title: 'Home',
						url: '/',
						icon: Home
					},
					{
						category: 'General',
						title: 'Profile',
						url: '/profile',
						icon: UserPen
					},
					{
						category: 'General',
						title: 'Settings',
						url: '/settings',
						icon: Settings2
					},
					{
						category: 'Avatars',
						title: 'Library',
						url: '/avatars/library',
						icon: LibraryBig
					},
					{
						category: 'Avatars',
						title: 'Random',
						url: '/avatars/random',
						icon: Dices
					},
					{
						category: 'Avatars',
						title: 'Cache',
						url: '/avatars/cache',
						icon: Book
					},
					{
						category: 'Avatars',
						title: 'Favorites',
						url: '/avatars/favorites',
						icon: BookMarked
					},
					{
						category: 'Avatars',
						title: 'History',
						url: '/avatars/history',
						icon: History
					},
					{
						category: 'Avatars',
						title: 'Collections',
						url: '/avatars/collections',
						icon: SquareLibrary
					},
					{
						category: 'Avatars',
						title: 'Profiles',
						url: '/avatars/profiles',
						icon: Stamp
					},
					{
						category: 'Avatars',
						title: 'Switcher',
						url: '/avatars/switcher',
						icon: SwatchBook
					},
					{
						category: 'Chatbox',
						title: 'Messages',
						url: '/chatbox/messages',
						icon: MessageSquare
					},
					{
						category: 'Chatbox',
						title: 'Editor',
						url: '/chatbox/editor',
						icon: MessageSquareDashed
					},
					{
						category: 'Chatbox',
						title: 'Profiles',
						url: '/chatbox/profiles',
						icon: MessagesSquare
					},
					{
						category: 'Tools',
						title: 'Avatar Importer',
						url: '/tools/import-avatars',
						icon: Import
					},
					{
						category: 'Tools',
						title: 'Avatar OSC',
						url: '/tools/avatar-osc',
						icon: SquareChartGantt,
						flags: ['CanSeeAvatarOSCTools']
					},
					{
						category: 'Moderation',
						title: 'Users',
						url: '/moderation/users',
						icon: Users,
						flags: ['Owner', 'Admin', 'Moderator']
					},
					{
						category: 'Moderation',
						title: 'Audits',
						url: '/moderation/audits',
						icon: Logs,
						flags: ['Owner', 'Admin', 'Moderator']
					},
					{
						category: 'Moderation',
						title: 'Blocked Avatars',
						url: '/moderation/avatars/blocked',
						icon: ShieldBan,
						flags: ['Owner', 'Admin']
					},
					{
						category: 'Moderation',
						title: 'B. Avatar Authors',
						url: '/moderation/avatars/blocked-authors',
						icon: ShieldBan,
						flags: ['Owner', 'Admin']
					},
					{
						category: 'Moderation',
						title: 'Avatar Reports',
						url: '/moderation/avatars/reports',
						icon: Flag,
						flags: ['Owner', 'Admin', 'Moderator']
					}
				].filter((item) => {
					if (item.flags) return item.flags.some((flag) => flags.includes(flag));
					return true;
				}),
				(item) => item.category
			)
		);
	});
</script>

<Sidebar.Root variant="sidebar">
	<Sidebar.Content>
		<ScrollArea>
			{#each groupedItems as [category, items] (category)}
				<Sidebar.Group>
					<Sidebar.GroupLabel>{category}</Sidebar.GroupLabel>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							{#each items! as item (item.title)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton
										class="{item.glowing
											? 'border border-yellow-500 drop-shadow-[0_0px_16px_#d6a40d]'
											: ''} transition-all duration-300"
									>
										{#snippet child({ props })}
											<a href={item.url} {...props}>
												<item.icon />
												<span class="opacity-95">{item.title}</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			{/each}
		</ScrollArea>
	</Sidebar.Content>
</Sidebar.Root>
