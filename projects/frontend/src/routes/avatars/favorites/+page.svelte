<script lang="ts">
	import { api } from '$lib/base/api';
	import type { Avatar } from '$lib/base/api/list/VRCKit/Avatars';
	import {
		ListFilter,
		ListFilterPlus,
		MoveLeft,
		MoveRight,
		RefreshCcw,
		Search
	} from 'lucide-svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import _ from 'lodash';
	import VerticalAvatarCard from '$lib/components/vertical-avatar-card.svelte';
	import { onMount } from 'svelte';
	import * as Popover from '$lib/components/ui/popover/index';

	const PerPage = 50;

	let loading = $state(true);

	type SearchParams = {
		page: number;
		query: string;
		query_engine: 'basic' | 'complex';
	};

	let searchParams: SearchParams = $state({
		page: 0,
		query: '',
		query_engine: 'basic'
	});

	type PageContent = {
		total_count: number;
		max_limit: number;
		avatars: {
			avatar: Avatar;
			created_at: string;
			estimated_order_id: number; // This is the estimated order ID based on the skip value
			custom_order_id: number; // This is the custom order ID if set
		}[];
	};

	let pageContent: PageContent = $state({
		total_count: 0,
		max_limit: 0,
		avatars: []
	});

	let ignoreScroll = false;

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.users.current.favoriteAvatars.search(
			searchParams.query,
			searchParams.page * PerPage,
			PerPage,
			searchParams.query_engine
		);

		queueMicrotask(() => {
			if (ignoreScroll) {
				ignoreScroll = false;
				return;
			}
			document.querySelector('#avatar-favorites > div')?.scroll({
				top: 0,
				left: 0,
				behavior: 'smooth'
			});
		});

		loading = false;
	}

	const debouncedLoadPage = _.debounce(loadPage, 250);

	let collections = $state<{ id: string; name: string }[]>([]);

	onMount(() => {
		api.database.keyValues.get<SearchParams>('Page;AvatarFavorites;SearchParams').then((v) => {
			if (v) {
				searchParams = v;
			} else {
				loadPage();
			}
		});
		api.vrckit.users.current.avatarCollections.fetch().then((c) => {
			collections = c.map((i) => ({ id: i.id, name: i.name }));
		});
	});

	$effect(() => {
		searchParams.page;
		searchParams.query;
		api.database.keyValues.set('Page;AvatarFavorites;SearchParams', { ...searchParams });
		debouncedLoadPage();
	});

	function moveAvatarInCache(id: string, direction: 'Up' | 'Down', value: number = 1) {
		const index = pageContent.avatars.findIndex((i) => i.avatar.id === id);
		if (index === -1) return;

		const newIndex = direction === 'Up' ? index - value : index + value;
		if (newIndex < 0 || newIndex >= pageContent.avatars.length) return;

		const avatar = pageContent.avatars[index];
		pageContent.avatars.splice(index, 1);
		pageContent.avatars.splice(newIndex, 0, avatar);
	}
</script>

<svelte:head>
	<title>Favorite Avatars</title>
</svelte:head>

<div class="relative">
	<ScrollArea class="h-full w-[var(--full-width)]" id="avatar-favorites">
		<div
			style="z-index: 99999;"
			class="fixed flex w-[var(--full-width)] items-center justify-between bg-black bg-opacity-75 p-2"
		>
			<Popover.Root>
				<Popover.Trigger>
					<Button variant="outline">
						{#if loading}
							<RefreshCcw class="animate-spin" />
						{:else}
							<Search />
						{/if}
						Search
					</Button>
				</Popover.Trigger>
				<Popover.Content class="flex flex-col" align="start" id="search_tooltip">
					<div class="flex flex-col gap-2 p-2">
						<div class="flex gap-2">
							<div class="flex flex-1 flex-col gap-2">
								<Label for="search_query"
									>Search ({pageContent.total_count.toLocaleString()}/{pageContent.max_limit.toLocaleString()}
									results)</Label
								>
								<Input
									id="search_query"
									bind:value={searchParams.query}
									oninput={() => (searchParams.page = 0)}
									onClear={() => (searchParams.page = 0)}
								/>
							</div>
							<div class="flex min-w-[40px] flex-col items-start gap-2">
								<Label>Engine</Label>

								<Tooltip.Provider delayDuration={0} disableCloseOnTriggerClick>
									<Tooltip.Root>
										<Tooltip.Trigger>
											<Button
												variant="outline"
												size="icon"
												onclick={() =>
													(searchParams.query_engine =
														searchParams.query_engine === 'basic' ? 'complex' : 'basic')}
											>
												{#if searchParams.query_engine === 'basic'}
													<ListFilter />
												{:else}
													<ListFilterPlus />
												{/if}
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content class="flex flex-col">
											<div class="font-semibold">Search Engine:</div>
											<div class="text-sm text-gray-500">
												{searchParams.query_engine === 'basic' ? 'Basic' : 'Complex'}
											</div>
										</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							</div>
						</div>
						<Button variant="outline" onclick={loadPage} disabled={loading}>
							<RefreshCcw class="mr-2 size-4" />
							Refresh
						</Button>
					</div>
				</Popover.Content>
			</Popover.Root>

			{#if pageContent.total_count !== 0}
				<Pagination.Root
					count={pageContent.total_count}
					perPage={50}
					page={searchParams.page + 1}
					onPageChange={(value) => (searchParams.page = value - 1)}
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
										<Pagination.Link {page} isActive={currentPage === page.value}>
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
			{#each pageContent.avatars as fa, faIdx (fa.avatar.id)}
				<span style="z-index: {50 - faIdx}">
					<VerticalAvatarCard
						avatar={fa.avatar}
						{collections}
						search={(query, engine) => {
							searchParams.page = 0;
							searchParams.query = query;
							searchParams.query_engine = engine;
						}}
						onFavoriteToggle={(state) => {
							if (!state) {
								pageContent.avatars = pageContent.avatars.filter(
									(i) => i.avatar.id !== fa.avatar.id
								);
							}
						}}
						showOpenInLibrary
					>
						{#snippet imageBottomLeftItems()}
							<Tooltip.Provider delayDuration={0}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<button
											class="bg-popover flex cursor-pointer items-center gap-1 rounded-md border p-1"
											onclick={async () => {
												ignoreScroll = true;
												moveAvatarInCache(fa.avatar.id, 'Up');
												await api.vrckit.users.current.favoriteAvatars.move(fa.avatar.id, 'Up');
												api.toast.success('Avatar moved to next position.', {
													description: `Avatar ${fa.avatar.name} moved to next position successfully.`
												});
											}}
										>
											<MoveLeft size={16} />
										</button>
									</Tooltip.Trigger>
									<Tooltip.Content>Move to previous position</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
							<Tooltip.Provider delayDuration={0}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<button
											class="bg-popover flex cursor-pointer items-center gap-1 rounded-md border p-1"
											onclick={async () => {
												ignoreScroll = true;
												moveAvatarInCache(fa.avatar.id, 'Down');
												await api.vrckit.users.current.favoriteAvatars.move(fa.avatar.id, 'Down');
												api.toast.success('Avatar moved to previous position.', {
													description: `Avatar ${fa.avatar.name} moved to previous position successfully.`
												});
											}}
										>
											<MoveRight size={16} />
										</button>
									</Tooltip.Trigger>
									<Tooltip.Content>Move to next position</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						{/snippet}
					</VerticalAvatarCard>
				</span>
			{/each}
		</div>
		{#if pageContent.total_count === 0}
			<div class="flex w-full flex-1 flex-col items-center justify-center gap-1 p-4">
				<h1 class="cursor-default text-xl font-semibold">No results was found</h1>
				<p class="cursor-default text-gray-500">Try searching for something else</p>
			</div>
		{/if}
	</ScrollArea>
</div>
