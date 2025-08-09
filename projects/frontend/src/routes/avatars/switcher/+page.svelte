<script lang="ts">
	import type { AvatarProfile } from '$lib/base/api/list/VRCKit/AvatarProfiles';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import Button from '$lib/components/ui/button/button.svelte';
	import { LibraryBig, LockKeyhole, LockKeyholeOpen, RefreshCcw, Search } from 'lucide-svelte';
	import _ from 'lodash';
	import { api } from '$lib/base/api';
	import * as Card from '$lib/components/ui/card/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { goto } from '$app/navigation';

	const PerPage = 50;

	let loading = $state(true);

	type SearchParams = {
		page: number;
		only_private: boolean;
		query: string;
	};

	let searchParams: SearchParams = $state({
		page: 0,
		only_private: false,
		query: ''
	});

	type PageContent = {
		total_count: number;
		profiles: AvatarProfile[];
	};

	let pageContent: PageContent = $state({
		profiles: [],
		total_count: 0
	});

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.avatarProfiles.search(
			searchParams.query,
			searchParams.page * PerPage,
			PerPage,
			searchParams.only_private,
			true
		);

		loading = false;
	}

	const debouncedLoadPage = _.debounce(loadPage, 250);

	$effect(() => {
		searchParams.page;
		searchParams.query;
		searchParams.only_private;
		debouncedLoadPage();
	});
</script>

<svelte:head>
	<title>Avatar Switcher</title>
</svelte:head>

<div class="relative w-full">
	<ScrollArea class="h-full w-full">
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
		<div class="flex w-full flex-col items-center gap-2 p-4 pt-16">
			{#each pageContent.profiles as profile (profile.id)}
				<ContextMenu.Root>
					<ContextMenu.Trigger class="w-full">
						<Card.Root class="w-full">
							<Card.Content class="w-full p-2">
								<div class="flex items-center justify-between">
									<div class="flex gap-2">
										<img
											src={api.utils.avatarImageURL(profile.avatar_id)}
											draggable="false"
											alt="Avatar Image of {profile.name}"
											class="h-12 w-12 rounded-md object-cover"
										/>
										<div class="flex flex-col">
											<div class="flex items-center gap-1">
												<Card.Title class="text-xl">{profile.name}</Card.Title>
												<Card.Description class="flex gap-1">
													by <div class="font-semibold">{profile.author.display_name}</div>
												</Card.Description>
											</div>
											<div class="flex items-center gap-1">
												<Card.Title class="text-sm text-gray-300">{profile.avatar!.name}</Card.Title
												>
												<Card.Description class="flex gap-1 text-gray-500">
													by <div class="font-semibold">{profile.avatar!.author_name}</div>
												</Card.Description>
											</div>
										</div>
									</div>
									<div class="flex gap-2">
										<Button
											variant="outline"
											onclick={async () => {
												api.toast.info('Selecting profile..');
												const success = await api.utils.selectAvatarProfile(profile.id);
												if (success) {
													api.toast.success('Profile selected!');
												} else {
													api.toast.error('Failed to select profile.');
												}
											}}>Select</Button
										>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					</ContextMenu.Trigger>
					<ContextMenu.Content>
						<ContextMenu.Item
							class="flex cursor-pointer items-center gap-2"
							onclick={() => {
								goto(
									`/avatars/library?query=${encodeURIComponent(`id:"${profile.avatar_id}"`)}&query_engine=complex`,
									{ replaceState: true }
								);
							}}
						>
							<LibraryBig size={18} />
							Open in Library
						</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			{/each}
		</div>
	</ScrollArea>
</div>
