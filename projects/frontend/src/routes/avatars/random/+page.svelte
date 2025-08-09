<script lang="ts">
	import { api } from '$lib/base/api';
	import type { Avatar } from '$lib/base/api/list/VRCKit/Avatars';
	import {
		ArrowDownNarrowWide,
		ArrowUpWideNarrow,
		Bomb,
		Dices,
		ListFilter,
		ListFilterPlus,
		RefreshCcw,
		Search,
		Trash2
	} from 'lucide-svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import * as Select from '$lib/components/ui/select/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import _ from 'lodash';
	import VerticalAvatarCard from '$lib/components/vertical-avatar-card.svelte';
	import { onMount } from 'svelte';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import AvatarCardList from '$lib/components/avatar-card-list.svelte';

	let loading = $state(true);

	type PageContent = {
		avatars: Avatar[];
		total_count: number;
	};

	let pageContent: PageContent = $state({
		avatars: [],
		total_count: 0
	});

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.avatars.search('@random', 0, 50);

		queueMicrotask(() => {
			document.querySelector('#avatar-random > div')?.scroll({
				top: 0,
				left: 0,
				behavior: 'smooth'
			});
		});

		loading = false;
	}

	let collections = $state<{ id: string; name: string }[]>([]);

	let currentUser: CurrentUser | null = $state(null);

	onMount(() => {
		api.vrckit.users.current.avatarCollections.fetch().then((c) => {
			collections = c.map((i) => ({ id: i.id, name: i.name }));
		});

		api.vrckit.users.current.fetch().then((c) => {
			currentUser = c;
		});

		loadPage();
	});
</script>

<svelte:head>
	<title>Avatar Random</title>
</svelte:head>

<div class="relative">
	<ScrollArea class="h-full w-[var(--full-width)]" id="avatar-random">
		<div
			class="fixed z-10 flex w-[var(--full-width)] items-center justify-between bg-black bg-opacity-75 p-2"
		>
			<Button variant="outline" onclick={loadPage}>
				{#if loading}
					<RefreshCcw class="animate-spin" />
				{:else}
					<Dices />
				{/if}
				Random
			</Button>
		</div>
		<div class="m-4 flex flex-1 flex-wrap justify-center gap-4 p-4 pt-12">
			<AvatarCardList avatars={pageContent.avatars}>
				{#snippet card({ avatar })}
					<VerticalAvatarCard {avatar} {collections} search={(query, engine) => {}}>
						{#snippet extraContextMenuItems()}
							{#if currentUser}
								{#if currentUser!.id === avatar.uploader_id || ['Owner', 'Admin', 'Moderator', 'Trusted'].some( (i) => currentUser!.system_flags.includes(i) )}
									<ContextMenu.Separator />
									<ContextMenu.Sub>
										<ContextMenu.SubTrigger
											class="flex cursor-pointer items-center gap-2 text-red-500"
										>
											<Trash2 size={18} />
											Delete & Block
										</ContextMenu.SubTrigger>
										<ContextMenu.SubContent>
											<ContextMenu.Item
												class="flex cursor-pointer items-center gap-2 text-red-500"
												onclick={async () => {
													api.toast.info('Deleting avatar..', { duration: 1000 });
													await api.vrckit.avatars.delete(avatar.id);
													api.toast.success('Avatar deleted.', {
														description: `The avatar ${avatar.name} has been deleted.`,
														duration: 3000
													});
													loadPage();
												}}
											>
												<Trash2 size={18} />
												Delete
											</ContextMenu.Item>
											<ContextMenu.Item
												class="flex cursor-pointer items-center gap-2 text-red-500"
												onclick={async () => {
													api.toast.info('Blocking avatar..', { duration: 1000 });
													await api.vrckit.avatars.delete(avatar.id, true);
													api.toast.success('Avatar blocked.', {
														description: `The avatar ${avatar.name} has been blocked.`,
														duration: 3000
													});
													loadPage();
												}}
											>
												<Bomb size={18} />
												Block
											</ContextMenu.Item>
										</ContextMenu.SubContent>
									</ContextMenu.Sub>
								{/if}
							{/if}
						{/snippet}
					</VerticalAvatarCard>
				{/snippet}
			</AvatarCardList>
		</div>
		{#if pageContent.total_count === 0}
			<div class="flex w-full flex-1 flex-col items-center justify-center gap-1 p-4">
				<h1 class="cursor-default text-xl font-semibold">No results was found</h1>
				<p class="cursor-default text-gray-500">Try searching for something else</p>
			</div>
		{/if}
	</ScrollArea>
</div>
