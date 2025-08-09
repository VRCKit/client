<script lang="ts">
	import { api } from '$lib/base/api';
	import type { Avatar } from '$lib/base/api/list/VRCKit/Avatars';
	import { Bomb, RefreshCcw, Search, Trash2 } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import _ from 'lodash';
	import VerticalAvatarCard from '$lib/components/vertical-avatar-card.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import AvatarCardList from '$lib/components/avatar-card-list.svelte';
	import { goto } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import SearchQueryBuilderDialogContent from '$lib/components/search-query-builder-dialog-content.svelte';

	const PerPage = 50;

	let loading = $state(true);

	type SearchParams = {
		page: number;
		query: string;
		query_engine: 'basic' | 'complex' | 'redis';
		sort_key: string;
		sort_dir: 'asc' | 'desc';
	};

	let searchParams: SearchParams = $state({
		page: 0,
		query: '',
		query_engine: 'basic',
		sort_key: 'created_at',
		sort_dir: 'desc'
	});

	type PageContent = {
		avatars: Avatar[];
		total_count: number;
	};

	let pageContent: PageContent = $state({
		avatars: [],
		total_count: 0
	});

	async function onSearch(query: string, engine: string, sorting: string, force?: boolean) {
		loading = true;

		searchParams.query = query;
		searchParams.query_engine = engine as 'basic' | 'complex' | 'redis';
		searchParams.sort_key = sorting.split(':')[0];
		searchParams.sort_dir = sorting.split(':')[1] as 'asc' | 'desc';

		pageContent = await api.vrckit.avatars.search(
			query,
			searchParams.page * PerPage,
			PerPage,
			engine as 'basic' | 'complex' | 'redis',
			sorting.split(':')[0],
			sorting.split(':')[1] as 'asc' | 'desc',
			force ? true : undefined
		);

		queueMicrotask(() => {
			document.querySelector('#avatar-library > div')?.scroll({
				top: 0,
				left: 0,
				behavior: 'smooth'
			});
		});

		loading = false;
	}

	function refreshSearch(force = false) {
		onSearch(
			searchParams.query,
			searchParams.query_engine,
			`${searchParams.sort_key}:${searchParams.sort_dir}`,
			force ? true : undefined
		);
	}

	const refreshDebounced = _.debounce(refreshSearch, 50);

	let collections = $state<{ id: string; name: string }[]>([]);

	let currentUser: CurrentUser | null = $state(null);
	let isPremium = $state(false);

	function updateSearchParams() {
		api.database.keyValues.update(`SearchQueryBuilder;History;AvatarLibrarySearch`, (value) => {
			return {
				...(value || {}),
				search: (() => {
					if (searchParams.query.startsWith('@tags ')) {
						return searchParams.query
							.slice(6)
							.trim()
							.split(',')
							.map((tag) => tag.trim())
							.join(' ');
					} else {
						return searchParams.query;
					}
				})(),
				search_mode: searchParams.query.startsWith('@tags')
					? 'Tags'
					: searchParams.query_engine === 'complex'
						? 'Complex'
						: 'FullText',
				sort_by: searchParams.sort_key,
				sort_by_direction: searchParams.sort_dir
			};
		});
	}

	onMount(() => {
		const paramKeys = ['query', 'query_engine', 'page'];
		if (paramKeys.some((i) => page.url.searchParams.has(i))) {
			paramKeys.forEach((i) => {
				if (page.url.searchParams.has(i)) {
					// @ts-ignore
					searchParams[i] =
						i === 'page' ? Number(page.url.searchParams.get(i)) : page.url.searchParams.get(i);
				}
			});
			updateSearchParams();
			refreshDebounced();
		} else {
			(async () => {
				const sp = await api.database.keyValues.get<SearchParams>(
					'Page;AvatarLibrary;SearchParams'
				);
				if (sp) searchParams.page = sp.page;
				const history = await api.database.keyValues.get<{
					search: string;
					search_mode: 'Tags' | 'FullText' | 'Complex';
					platform: 'StandaloneWindows' | 'Android' | 'iOS' | 'All';
					sort_by: 'created_at' | 'updated_at' | 'avatar_created_at' | 'avatar_updated_at' | 'name';
					sort_by_direction: 'asc' | 'desc';
				}>(`SearchQueryBuilder;History;AvatarLibrarySearch`);
				if (history) {
					searchParams.query = history.search;
					searchParams.query_engine = history.search_mode === 'Complex' ? 'complex' : 'basic';
					searchParams.sort_key = history.sort_by;
					searchParams.sort_dir = history.sort_by_direction;
				}
				refreshDebounced();
			})();
		}

		api.vrckit.users.current.avatarCollections.fetch().then((c) => {
			collections = c.map((i) => ({ id: i.id, name: i.name }));
		});

		api.vrckit.users.current.fetch().then(async (c) => {
			currentUser = c;
			isPremium = await api.vrckit.users.current.isPremium('Admin', 'Owner', 'Moderator');
		});
	});

	$effect(() => {
		searchParams.page;
		api.database.keyValues.set('Page;AvatarLibrary;SearchParams', { ...searchParams });
	});

	let queryBuilderDialogOpen = $state(false);
</script>

<svelte:head>
	<title>Avatar Library</title>
</svelte:head>

<div class="relative">
	<ScrollArea class="h-full w-[var(--full-width)]" id="avatar-library">
		<div
			class="fixed z-10 flex w-[var(--full-width)] items-center justify-between bg-black bg-opacity-75 p-2"
		>
			<div class="flex items-center gap-2">
				<Dialog.Root
					open={queryBuilderDialogOpen}
					onOpenChange={(v) => (queryBuilderDialogOpen = v)}
				>
					<Dialog.Trigger>
						<Button variant="outline">
							{#if loading}
								<RefreshCcw class="animate-spin" />
							{:else}
								<Search />
							{/if}
							Search
						</Button>
					</Dialog.Trigger>
					<Dialog.Content>
						<SearchQueryBuilderDialogContent
							title="Avatar Library Search"
							key="AvatarLibrarySearch"
							onSearch={(query, engine, sorting, force) => {
								queryBuilderDialogOpen = false;
								searchParams.page = 0;
								onSearch(query, engine, sorting, force);
							}}
						/>
					</Dialog.Content>
				</Dialog.Root>
				<div class="flex gap-1">
					<span class="font-semibold text-gray-300">{pageContent.total_count.toLocaleString()}</span
					>
					<span class="font-light text-gray-200">results.</span>
				</div>
			</div>
			{#if pageContent.total_count !== 0}
				<Pagination.Root
					count={pageContent.total_count}
					perPage={50}
					page={searchParams.page + 1}
					onPageChange={(value) => {
						if (!(value > 5 && !isPremium)) {
							searchParams.page = value - 1;
							refreshSearch();
						} else {
							api.toast.warning('You need to be a premium user to access pages above 5.');
							goto('/premium');
						}
					}}
					class="items-end"
				>
					{#snippet children({ pages, currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.PrevButton />
							</Pagination.Item>
							{#each pages as page (page.key)}
								{#if page.type === 'ellipsis'}
									<Pagination.Item>
										<Pagination.Ellipsis />
									</Pagination.Item>
								{:else}
									<Pagination.Item>
										<Pagination.Link
											{page}
											isActive={currentPage === page.value}
											class={page.value > 5 && !isPremium
												? 'border border-yellow-500 drop-shadow-[0_0px_4px_#d6a40d]'
												: ''}
										>
											{page.value}
										</Pagination.Link>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.NextButton />
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			{/if}
		</div>
		<div class="m-4 flex flex-1 flex-wrap justify-center gap-4 p-4 pt-12">
			{#each pageContent.avatars as avatar (avatar.id)}{/each}
			<AvatarCardList avatars={pageContent.avatars}>
				{#snippet card({ avatar })}
					<VerticalAvatarCard
						{avatar}
						{collections}
						search={(query, engine) => {
							searchParams.page = 0;
							searchParams.query = query;
							searchParams.query_engine = engine;
							updateSearchParams();
							refreshSearch();
						}}
					>
						{#snippet extraContextMenuItems()}
							{#if currentUser}
								{#if currentUser!.id === avatar.uploader_id || ['Owner', 'Admin', 'Moderator'].some( (i) => currentUser!.system_flags.includes(i) )}
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
													refreshSearch(true);
												}}
											>
												<Trash2 size={18} />
												Delete
											</ContextMenu.Item>
											<ContextMenu.Item
												class="flex cursor-pointer items-center gap-2 text-red-500"
												disabled={!['Owner', 'Admin'].some((i) =>
													currentUser!.system_flags.includes(i)
												)}
												onclick={async () => {
													api.toast.info('Blocking avatar..', { duration: 1000 });
													await api.vrckit.avatars.delete(avatar.id, true);
													api.toast.success('Avatar blocked.', {
														description: `The avatar ${avatar.name} has been blocked.`,
														duration: 3000
													});
													refreshSearch(true);
												}}
											>
												<Bomb size={18} />
												Block
											</ContextMenu.Item>
											<ContextMenu.Item
												class="flex cursor-pointer items-center gap-2 text-red-500"
												disabled={!['Owner', 'Admin'].some((i) =>
													currentUser!.system_flags.includes(i)
												)}
												onclick={async () => {
													api.toast.info('Blocking avatar author..', { duration: 1000 });
													await api.vrckit.moderation.avatars.blockedAuthors.put(
														avatar.author_id,
														'AvatarLibrary'
													);
													api.toast.success('Avatar author blocked.', {
														description: `The avatar author ${avatar.author_name} has been blocked.`,
														duration: 3000
													});
													refreshSearch(true);
												}}
											>
												<Bomb size={18} />
												Block Author
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
