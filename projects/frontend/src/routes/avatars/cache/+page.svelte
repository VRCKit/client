<script lang="ts">
	import { api } from '$lib/base/api';
	import { RefreshCcw, Search } from 'lucide-svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import _ from 'lodash';
	import { onMount } from 'svelte';
	import type { DatabaseAvatar } from '$lib/base/api/list/Database/Avatars';
	import VerticalCacheAvatarCard from '$lib/components/vertical-cache-avatar-card.svelte';
	import * as Popover from '$lib/components/ui/popover/index';

	const PerPage = 50;

	let loading = $state(true);

	type SearchParams = {
		page: number;
		query: string;
	};

	let searchParams: SearchParams = $state({
		page: 0,
		query: ''
	});

	type PageContent = {
		avatars: DatabaseAvatar[];
		total_count: number;
	};

	let pageContent: PageContent = $state({
		avatars: [],
		total_count: 0
	});

	async function loadPage() {
		loading = true;
		await Promise.all([
			(async () => {
				pageContent.total_count = await api.database.avatars.count(searchParams.query);
			})(),
			(async () => {
				pageContent.avatars = await api.database.avatars.search(
					searchParams.query,
					searchParams.page * PerPage,
					PerPage
				);
			})()
		]);
		loading = false;
	}

	const debouncedLoadPage = _.debounce(loadPage, 250);

	onMount(() => {
		api.database.keyValues.get<SearchParams>('Page;AvatarCache;SearchParams').then((v) => {
			if (v) {
				searchParams = v;
			} else {
				loadPage();
			}
		});

		function onNewCacheAvatar(avatar: DatabaseAvatar) {
			if (!pageContent.avatars.some((i) => i.id === avatar.id) && !searchParams.query) {
				pageContent.avatars.unshift(avatar);
				pageContent.avatars.length = Math.min(pageContent.avatars.length, PerPage);
			}
			pageContent.total_count++;
		}

		api.events.on('CacheScanner;NewAvatar', onNewCacheAvatar);

		return () => {
			api.events.off('CacheScanner;NewAvatar', onNewCacheAvatar);
		};
	});

	$effect(() => {
		searchParams.page;
		searchParams.query;
		api.database.keyValues.set('Page;AvatarCache;SearchParams', { ...searchParams });
		debouncedLoadPage();
	});
</script>

<svelte:head>
	<title>Avatar Cache</title>
</svelte:head>

<div class="relative">
	<ScrollArea class="h-full w-[var(--full-width)]">
		<div
			class="fixed z-10 flex w-[var(--full-width)] items-center justify-between bg-black bg-opacity-75 p-2"
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
									>Search ({pageContent.total_count.toLocaleString()} results)</Label
								>
								<Input
									id="search_query"
									bind:value={searchParams.query}
									oninput={() => (searchParams.page = 0)}
									onClear={() => (searchParams.page = 0)}
								/>
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
			{#each pageContent.avatars as avatar (avatar.id)}
				<VerticalCacheAvatarCard
					{avatar}
					search={(query) => {
						searchParams.page = 0;
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
</div>
