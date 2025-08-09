<script lang="ts">
	import { api } from '$lib/base/api';
	import type { Avatar } from '$lib/base/api/list/VRCKit/Avatars';
	import { ListFilter, ListFilterPlus, RefreshCcw, Search } from 'lucide-svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import _ from 'lodash';
	import VerticalAvatarCard from '$lib/components/vertical-avatar-card.svelte';
	import { onMount } from 'svelte';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
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
		avatars: {
			id: string;
			avatar: Avatar;
			created_at: string;
		}[];
	};

	let pageContent: PageContent = $state({
		total_count: 0,
		avatars: []
	});

	let currentUser: CurrentUser | null = $state(null);

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.users.current.avatarHistory.search(
			searchParams.query,
			searchParams.page * PerPage,
			PerPage,
			searchParams.query_engine
		);

		queueMicrotask(() => {
			document.querySelector('#avatar-history > div')?.scroll({
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
		api.database.keyValues.get<SearchParams>('Page;AvatarHistory;SearchParams').then((v) => {
			if (v) {
				searchParams = v;
			} else {
				loadPage();
			}
		});
		api.vrckit.users.current.avatarCollections.fetch().then((c) => {
			collections = c.map((i) => ({ id: i.id, name: i.name }));
		});
		api.vrckit.users.current.fetch().then((u) => {
			currentUser = u;
		});

		function avatarSelected({ from }: { id: string; from: string }) {
			if (from !== 'OSC') loadPage();
		}

		api.events.on('AvatarSelected', avatarSelected);
		api.events.on('AvatarSelectSuccess', loadPage);
		return () => {
			api.events.off('AvatarSelected', avatarSelected);
			api.events.off('AvatarSelectSuccess', loadPage);
		};
	});

	$effect(() => {
		searchParams.page;
		searchParams.query;
		api.database.keyValues.set('Page;AvatarHistory;SearchParams', { ...searchParams });
		debouncedLoadPage();
	});
</script>

<svelte:head>
	<title>Avatar Select History</title>
</svelte:head>

<div class="relative">
	<ScrollArea class="h-full w-[var(--full-width)]" id="avatar-history">
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
			{#each pageContent.avatars as fa (fa.created_at)}
				<VerticalAvatarCard
					avatar={fa.avatar}
					{collections}
					showDelete={!!currentUser && currentUser.system_flags.some((i) => i.includes('Premium'))}
					onDelete={async () => {
						pageContent.avatars = pageContent.avatars.filter((i) => i.created_at !== fa.created_at);
						await api.vrckit.users.current.avatarHistory.delete(fa.id);
						api.toast.success('Deleted from history', {
							duration: 3000,
							description: `Deleted avatar ${fa.avatar.name} from history`
						});
					}}
					search={(query, engine) => {
						searchParams.page = 0;
						searchParams.query = query;
						searchParams.query_engine = engine;
					}}
					showInfo
					showOpenInLibrary
				>
					{#snippet info()}
						<div class="text-semibold text-center text-sm">Selected At</div>
						<div class="text-xs text-gray-500">
							{new Date(fa.created_at).toLocaleString()}
						</div>
					{/snippet}
				</VerticalAvatarCard>
			{/each}
		</div>
		{#if pageContent.total_count === 0}
			<div class="flex w-full flex-1 flex-col items-center justify-center gap-1 p-4">
				<h1 class="cursor-default text-xl font-semibold">No results was found</h1>
				<p class="cursor-default text-gray-500">
					Try selecting new avatars or try searching for something else
				</p>
			</div>
		{/if}
	</ScrollArea>
</div>
