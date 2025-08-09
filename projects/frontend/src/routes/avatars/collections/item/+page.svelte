<script lang="ts">
	import { api } from '$lib/base/api';
	import type { Avatar } from '$lib/base/api/list/VRCKit/Avatars';
	import {
		Blocks,
		ImageIcon,
		ListFilter,
		ListFilterPlus,
		LockKeyhole,
		LockKeyholeOpen,
		Pencil,
		ReceiptText,
		RefreshCcw,
		Search,
		Trash2
	} from 'lucide-svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import _ from 'lodash';
	import VerticalAvatarCard from '$lib/components/vertical-avatar-card.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import type { AvatarCollection } from '$lib/base/api/list/VRCKit/AvatarCollections';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import * as Card from '$lib/components/ui/card/index';
	import MultiAvatarImage from '$lib/components/multi-avatar-image.svelte';
	import EditCollectionDialogContent from '$lib/components/edit-collection-dialog-content.svelte';
	import { Highlight } from 'svelte-highlight';
	import jsonLang from 'svelte-highlight/languages/json';
	import * as Popover from '$lib/components/ui/popover/index';

	const PerPage = 50;

	let loading = $state(true);

	type SearchParams = {
		page: number;
		query: string;
		query_engine: 'basic' | 'complex';
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
		items: Avatar[];
		total_count: number;
		max_limit: number;
	};

	let pageContent: PageContent = $state({
		items: [],
		total_count: 0,
		max_limit: 0
	});

	let collection: AvatarCollection | null = $state(null);

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.avatarCollections.items.search(
			page.url.searchParams.get('id')!,
			searchParams.query,
			searchParams.page * PerPage,
			PerPage,
			searchParams.query_engine
		);

		queueMicrotask(() => {
			document.querySelector('#avatar-collection-items > div')?.scroll({
				top: 0,
				left: 0,
				behavior: 'smooth'
			});
		});

		loading = false;
	}

	const debouncedLoadPage = _.debounce(loadPage, 250);

	let collections = $state<{ id: string; name: string }[]>([]);

	let currentUser: CurrentUser | null = $state(null);

	function fetchCollection() {
		api.vrckit.avatarCollections.fetch(page.url.searchParams.get('id')!).then((c) => {
			collection = c;
		});
	}

	onMount(() => {
		loadPage();
		fetchCollection();
		api.vrckit.users.current.avatarCollections.fetch().then((c) => {
			collections = c.map((i) => ({ id: i.id, name: i.name }));
		});
		api.vrckit.users.current.fetch().then((c) => {
			currentUser = c;
		});
	});

	$effect(() => {
		searchParams.page;
		searchParams.sort_key;
		searchParams.sort_dir;
		searchParams.query;
		debouncedLoadPage();
	});

	let editDialogOpen = $state(false);
	let detailsOpen = $state(false);
</script>

<svelte:head>
	<title>Collection Items</title>
</svelte:head>

<div class="relative">
	<ScrollArea class="h-full w-[var(--full-width)]" id="avatar-collection-items">
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
				{#if currentUser}
					{#if currentUser!.id === collection?.author_id || ['Owner', 'Admin', 'Moderator'].some( (i) => currentUser!.system_flags.includes(i) )}
						<Dialog.Root open={editDialogOpen} onOpenChange={(v) => (editDialogOpen = v)}>
							<Dialog.Trigger>
								<Tooltip.Provider delayDuration={0}>
									<Tooltip.Root>
										<Tooltip.Trigger>
											<Button variant="outline" size="icon">
												<Pencil />
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content>Edit this collection</Tooltip.Content>
									</Tooltip.Root>
								</Tooltip.Provider>
							</Dialog.Trigger>
							<Dialog.Content>
								{#if collection}
									<EditCollectionDialogContent
										{collection}
										onClose={(deleted) => {
											editDialogOpen = false;
											if (!deleted) fetchCollection();
										}}
									/>
								{/if}
							</Dialog.Content>
						</Dialog.Root>
					{/if}
				{/if}
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
		<div class="my-4 w-full px-4 pt-12">
			<Card.Root>
				<Card.Content class="relative flex gap-8 p-8">
					<div class="h-[175px] w-[175px] min-w-[175px]">
						{#if currentUser}
							<ContextMenu.Root>
								<ContextMenu.Trigger class="h-[175px] w-[175px] min-w-[175px]">
									<MultiAvatarImage
										avatarIds={collection?.image_avatar_id
											? [collection.image_avatar_id]
											: pageContent.items.slice(0, 4).map((i) => i.id)}
									/>
								</ContextMenu.Trigger>
								<ContextMenu.Content>
									<ContextMenu.Item
										class="flex cursor-pointer items-center gap-2"
										onclick={() => (detailsOpen = true)}
									>
										<ReceiptText size={18} />
										Details
									</ContextMenu.Item>
									{#if currentUser}
										{#if currentUser!.id === collection?.author_id || ['Owner', 'Admin', 'Moderator'].some( (i) => currentUser!.system_flags.includes(i) )}
											<ContextMenu.Separator />
											<ContextMenu.Item
												class="flex cursor-pointer items-center gap-2"
												onclick={async () => {
													api.toast.info('Updating collection image..', { duration: 1000 });
													await api.vrckit.avatarCollections.patch(
														page.url.searchParams.get('id')!,
														{
															image_avatar_id: null
														}
													);
													if (collection) collection.image_avatar_id = null;
													api.toast.success('Collection image updated.', {
														description: `The collection image has been reset.`,
														duration: 3000
													});
												}}
											>
												<ImageIcon size={18} />
												Reset collection image
											</ContextMenu.Item>
										{/if}
									{/if}
								</ContextMenu.Content>
							</ContextMenu.Root>
						{/if}
					</div>
					<div class="flex flex-col gap-4">
						<div class="flex flex-col">
							<Card.Title class="flex items-start gap-1 text-4xl">
								{collection?.name ?? '...'}
								<div class="text-gray-500">
									{#if collection?.visibility === 'Private'}
										<LockKeyhole size={16} />
									{:else}
										<LockKeyholeOpen size={16} />
									{/if}
								</div>
							</Card.Title>
							<div class="flex gap-1 text-sm">
								<div class="text-lg font-normal text-gray-500">by</div>
								<div
									class="line-clamp-1 w-full text-start text-lg font-semibold tracking-tight text-gray-400"
								>
									{collection?.author.display_name ?? '...'}
								</div>
							</div>
						</div>
						<div class="text-md text-gray-500">
							{collection?.description ?? '...'}{collection?.tags ? ` (${collection.tags})` : ''}
						</div>
					</div>

					<div
						class="bg-popover text-popover-foreground absolute right-8 top-8 flex items-center gap-1 rounded-md border px-2 py-1"
					>
						<Blocks size={20} />
						<div class="text-md truncate font-light">
							{pageContent.total_count.toLocaleString()} items
						</div>
					</div>
				</Card.Content>
				<Dialog.Root bind:open={detailsOpen} onOpenChange={(v) => (detailsOpen = v)}>
					<Dialog.Content class="w-[800px] min-w-[800px]" style="-webkit-app-region: no-drag;">
						<Dialog.Header>
							<Dialog.Title>Collection Details</Dialog.Title>
						</Dialog.Header>
						<ScrollArea orientation="both" class="rounded-md">
							<Highlight language={jsonLang} code={JSON.stringify(collection, null, 2)} />
						</ScrollArea>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Root>
		</div>
		<div class="m-4 flex flex-1 flex-wrap justify-center gap-4">
			{#each pageContent.items as item (item.id)}
				<VerticalAvatarCard
					avatar={item}
					{collections}
					search={(query, engine) => {
						searchParams.page = 0;
						searchParams.query = query;
						searchParams.query_engine = engine;
					}}
				>
					{#snippet extraContextMenuItems()}
						<ContextMenu.Separator />
						<ContextMenu.Item
							class="flex cursor-pointer items-center gap-2"
							onclick={async () => {
								api.toast.info('Updating collection image..', { duration: 1000 });
								await api.vrckit.avatarCollections.patch(page.url.searchParams.get('id')!, {
									image_avatar_id: item.id
								});
								if (collection) collection.image_avatar_id = item.id;
								api.toast.success('Collection image updated.', {
									description: `The collection image has been updated to ${item.name}`,
									duration: 3000
								});
							}}
						>
							<ImageIcon size={18} />
							Set as collection image
						</ContextMenu.Item>
						{#if currentUser}
							{#if currentUser!.id === collection?.author_id || ['Owner', 'Admin', 'Moderator'].some( (i) => currentUser!.system_flags.includes(i) )}
								<ContextMenu.Item
									class="flex cursor-pointer items-center gap-2 text-red-500"
									onclick={async () => {
										api.toast.info('Deleting item..', { duration: 1000 });
										await api.vrckit.avatarCollections.items.delete(
											page.url.searchParams.get('id')!,
											item.id
										);
										pageContent.items = pageContent.items.filter((i) => i.id !== item.id);
										api.toast.success('Item deleted.', {
											description: `The ${item.name} has been deleted from the collection.`,
											duration: 3000
										});
									}}
								>
									<Trash2 size={18} />
									Delete from collection
								</ContextMenu.Item>
							{/if}
						{/if}
					{/snippet}
				</VerticalAvatarCard>
			{/each}
		</div>
		{#if pageContent.total_count === 0}
			<div class="flex w-full flex-1 flex-col items-center justify-center gap-1 p-4">
				<h1 class="cursor-default text-xl font-semibold">No results was found</h1>
				<p class="cursor-default text-gray-500">
					{#if (currentUser && currentUser!.id === collection?.author_id) || (currentUser && ['Owner', 'Admin', 'Moderator'].some( (i) => currentUser!.system_flags.includes(i) ))}
						Try adding some items to this collection.
					{:else}
						Try searching for something else.
					{/if}
				</p>
			</div>
		{/if}
	</ScrollArea>
</div>
