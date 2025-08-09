<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import Button from '$lib/components/ui/button/button.svelte';
	import { IdCard, Plus, RefreshCcw, Search, ShieldMinus } from 'lucide-svelte';
	import _ from 'lodash';
	import { api } from '$lib/base/api';
	import * as Card from '$lib/components/ui/card/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { onMount } from 'svelte';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import type { BlockedAvatarAuthor } from '$lib/base/api/list/VRCKit/Moderation/Avatars/BlockedAuthors';
	import BlockAvatarAuthorDialogContent from '$lib/components/moderation/block-avatar-author-dialog-content.svelte';

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
		total_count: number;
		blocked_avatar_authors: BlockedAvatarAuthor[];
	};

	let pageContent: PageContent = $state({
		blocked_avatar_authors: [],
		total_count: 0
	});

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.moderation.avatars.blockedAuthors.search(
			searchParams.query,
			searchParams.page * PerPage,
			PerPage
		);

		loading = false;
	}

	const debouncedLoadPage = _.debounce(loadPage, 250);

	let auditTypes: string[] = $state([]);

	let currentUser: CurrentUser | null = $state(null);

	$effect(() => {
		searchParams.page;
		searchParams.query;
		debouncedLoadPage();
	});

	onMount(() => {
		api.vrckit.users.current.fetch().then((user) => {
			currentUser = user;
		});
		api.vrckit.moderation.audits.types().then((types) => {
			auditTypes = types;
		});
	});

	let blockAvatarAuthorDialogOpen = $state(false);

	let fetchedUsernames: Record<string, string> = $state({});

	async function fetchUsername(userId: string): Promise<string> {
		if (fetchedUsernames[userId]) return fetchedUsernames[userId];
		fetchedUsernames[userId] = 'Loading...';

		return api.vrchat.users.fetch(userId).then((user) => {
			fetchedUsernames[userId] = user.displayName;
			return user.display_name;
		});
	}
</script>

<svelte:head>
	<title>Blocked Avatar Authors</title>
</svelte:head>

<div class="relative w-full">
	<ScrollArea class="h-full w-full">
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
							<Button variant="outline" onclick={loadPage} disabled={loading}>
								<RefreshCcw class="mr-2 size-4" />
								Refresh
							</Button>
						</div>
					</Popover.Content>
				</Popover.Root>
				<Dialog.Root
					open={blockAvatarAuthorDialogOpen}
					onOpenChange={(value) => (blockAvatarAuthorDialogOpen = value)}
				>
					<Dialog.Trigger>
						<Tooltip.Provider>
							<Tooltip.Root delayDuration={0}>
								<Tooltip.Trigger>
									<Button variant="outline" size="icon">
										<Plus />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>Block an avatar author.</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</Dialog.Trigger>
					<Dialog.Content>
						<BlockAvatarAuthorDialogContent
							onClose={() => {
								blockAvatarAuthorDialogOpen = false;
								loadPage();
							}}
						/>
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
		<div class="flex w-full flex-col items-center gap-2 p-4 pt-16">
			{#each pageContent.blocked_avatar_authors as blockedAuthor (blockedAuthor.id)}
				<ContextMenu.Root>
					<ContextMenu.Trigger class="w-full">
						<Card.Root class="w-full" id="baa_{blockedAuthor.id}">
							<Card.Content class="w-full p-2">
								<div class="flex items-center justify-between">
									<div class="flex gap-2">
										<div class="flex flex-col">
											<div class="flex items-center gap-1">
												<Card.Title class="flex items-center gap-1 text-xl">
													{blockedAuthor.id}
												</Card.Title>
												<Card.Description
													class="flex w-fit gap-1"
													onclick={() => {
														if (!fetchedUsernames[blockedAuthor.id])
															fetchUsername(blockedAuthor.id);
													}}
												>
													{#if fetchedUsernames[blockedAuthor.id]}
														is {fetchedUsernames[blockedAuthor.id]}
													{:else}
														<span class="cursor-pointer hover:underline">(Who is this?)</span>
													{/if}
												</Card.Description>
											</div>
											<div class="flex flex-col text-xs text-gray-400">
												{new Date(blockedAuthor.created_at).toLocaleString()}
												{blockedAuthor.reason ? `/ ${blockedAuthor.reason}` : ''}
											</div>
										</div>
									</div>
									<div class="flex gap-2">
										<Tooltip.Provider delayDuration={0}>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<Button
														variant="outline"
														size="icon"
														onclick={async () => {
															api.toast.info('Unblocking avatar author...');
															const success =
																await api.vrckit.moderation.avatars.blockedAuthors.delete(
																	blockedAuthor.id
																);
															if (success) {
																api.toast.success('Avatar author unblocked');
																pageContent.blocked_avatar_authors =
																	pageContent.blocked_avatar_authors.filter(
																		(author) => author.id !== blockedAuthor.id
																	);
															} else {
																api.toast.error('Failed to unblock avatar author');
															}
														}}><ShieldMinus /></Button
													>
												</Tooltip.Trigger>
												<Tooltip.Content>Unblock Avatar</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					</ContextMenu.Trigger>
					<ContextMenu.Content>
						<ContextMenu.Item
							class="flex cursor-pointer items-center gap-2"
							onclick={() => {
								api.utils.copyText(blockedAuthor.id);
							}}
						>
							<IdCard size={18} />
							Copy Author Id
						</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			{/each}
		</div>
	</ScrollArea>
</div>
