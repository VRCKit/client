<script lang="ts">
	import { api } from '$lib/base/api';
	import {
		ArrowDownNarrowWide,
		ArrowUpWideNarrow,
		LockKeyhole,
		LockKeyholeOpen,
		Plus,
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
	import * as Select from '$lib/components/ui/select/index';
	import { onMount } from 'svelte';
	import type { AvatarCollection } from '$lib/base/api/list/VRCKit/AvatarCollections';
	import VerticalAvatarCollectionCard from '$lib/components/vertical-avatar-collection-card.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import CreateCollectionDialogContent from '$lib/components/create-collection-dialog-content.svelte';
	import * as Popover from '$lib/components/ui/popover/index';

	const PerPage = 50;
	const OrderingTypes = [
		{
			key: 'created_at',
			name: 'Created At'
		},
		{
			key: 'updated_at',
			name: 'Updated At'
		},
		{
			key: 'name',
			name: 'Name'
		},
		{
			key: 'like_count',
			name: 'Like Count'
		},
		{
			key: 'avatar_count',
			name: 'Avatar Count'
		}
	];

	let loading = $state(true);

	type SearchParams = {
		page: number;
		query: string;
		only_private: boolean;
		sort_key: string;
		sort_dir: 'asc' | 'desc';
	};

	let searchParams: SearchParams = $state({
		page: 0,
		query: '',
		query_engine: 'basic',
		only_private: false,
		sort_key: 'created_at',
		sort_dir: 'desc'
	});

	type PageContent = {
		total_count: number;
		collections: AvatarCollection[];
	};

	let pageContent: PageContent = $state({
		total_count: 0,
		collections: []
	});

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.avatarCollections.search(
			searchParams.query,
			searchParams.page * PerPage,
			PerPage,
			searchParams.only_private,
			searchParams.sort_key,
			searchParams.sort_dir
		);

		queueMicrotask(() => {
			document.querySelector('#avatar-collections > div')?.scroll({
				top: 0,
				left: 0,
				behavior: 'smooth'
			});
		});

		loading = false;
	}

	const debouncedLoadPage = _.debounce(loadPage, 250);

	onMount(() => {
		api.database.keyValues.get<SearchParams>('Page;AvatarCollections;SearchParams').then((v) => {
			if (v) {
				searchParams = v;
			} else {
				loadPage();
			}
		});
	});

	$effect(() => {
		searchParams.query;
		searchParams.page;
		searchParams.only_private;
		searchParams.sort_key;
		searchParams.sort_dir;
		api.database.keyValues.set('Page;AvatarCollections;SearchParams', { ...searchParams });
		debouncedLoadPage();
	});

	let createDialogOpen = $state(false);
</script>

<svelte:head>
	<title>Avatar Collections</title>
</svelte:head>

<div class="relative">
	<ScrollArea class="h-full w-[var(--full-width)]" id="avatar-collections">
		<div
			class="fixed z-10 flex w-[var(--full-width)] items-center justify-between bg-black bg-opacity-75 p-2"
		>
			<div class="flex items-center gap-2">
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
										>Search ({pageContent.total_count.toLocaleString()}
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
									<Label>Private</Label>

									<Tooltip.Provider delayDuration={0} disableCloseOnTriggerClick>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													variant="outline"
													size="icon"
													onclick={() => (searchParams.only_private = !searchParams.only_private)}
												>
													{#if searchParams.only_private}
														<LockKeyhole />
													{:else}
														<LockKeyholeOpen />
													{/if}
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content class="flex flex-col">
												<div class="font-semibold">Only Private:</div>
												<div class="text-sm text-gray-500">
													{searchParams.only_private ? 'Yes' : 'No'}
												</div>
											</Tooltip.Content>
										</Tooltip.Root>
									</Tooltip.Provider>
								</div>
							</div>
							<div class="flex gap-2">
								<div class="flex flex-1 flex-col gap-2">
									<Label>Sort By</Label>
									<Select.Root type="single" bind:value={searchParams.sort_key}>
										<Select.Trigger
											>{OrderingTypes.find((i) => i.key === searchParams.sort_key)!
												.name}</Select.Trigger
										>
										<Select.Content portalProps={{ to: '#search_tooltip' }}>
											{#each OrderingTypes as type}
												<Select.Item value={type.key}>{type.name}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<div class="flex min-w-[40px] flex-col items-start gap-2">
									<Label>Order</Label>
									<Tooltip.Provider delayDuration={0} disableCloseOnTriggerClick>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button
													variant="outline"
													size="icon"
													onclick={() =>
														(searchParams.sort_dir =
															searchParams.sort_dir === 'asc' ? 'desc' : 'asc')}
												>
													{#if searchParams.sort_dir === 'asc'}
														<ArrowDownNarrowWide />
													{:else}
														<ArrowUpWideNarrow />
													{/if}
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content class="flex flex-col">
												<div class="font-semibold">Sort Order:</div>
												<div class="text-sm text-gray-500">
													{searchParams.sort_dir === 'asc' ? 'Ascending' : 'Descending'}
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
				<Dialog.Root open={createDialogOpen} onOpenChange={(v) => (createDialogOpen = v)}>
					<Dialog.Trigger>
						<Tooltip.Provider delayDuration={0}>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button variant="outline" size="icon">
										<Plus />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>Create a new collection</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</Dialog.Trigger>
					<Dialog.Content>
						<CreateCollectionDialogContent onClose={() => (createDialogOpen = false)} />
					</Dialog.Content>
				</Dialog.Root>
			</div>
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
			{#each pageContent.collections as collection (collection.id)}
				<VerticalAvatarCollectionCard
					{collection}
					search={(query: string) => {
						searchParams.query = query;
					}}
				/>
			{/each}
		</div>
		{#if pageContent.total_count === 0}
			<div class="flex w-full flex-1 flex-col items-center justify-center gap-1 p-4">
				<h1 class="cursor-default text-xl font-semibold">No results was found</h1>
				<p class="cursor-default text-gray-500">Try searching for something else</p>
			</div>
		{/if}
	</ScrollArea>
	<div class="absolute left-4 top-4"></div>
</div>
