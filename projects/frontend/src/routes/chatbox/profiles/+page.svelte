<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		LibraryBig,
		LockKeyhole,
		LockKeyholeOpen,
		RefreshCcw,
		Search,
		Trash2
	} from 'lucide-svelte';
	import _ from 'lodash';
	import { api } from '$lib/base/api';
	import * as Card from '$lib/components/ui/card/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { goto } from '$app/navigation';
	import type { ChatboxProfile } from '$lib/base/api/list/VRCKit/ChatboxProfiles';
	import { Textarea } from '$lib/components/ui/textarea/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { onMount } from 'svelte';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';

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
		profiles: ChatboxProfile[];
	};

	let pageContent: PageContent = $state({
		profiles: [],
		total_count: 0
	});

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.chatboxProfiles.search(
			searchParams.query,
			searchParams.page * PerPage,
			PerPage,
			searchParams.only_private
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

	let currentUser = $state<CurrentUser | null>(null);

	onMount(async () => {
		currentUser = await api.vrckit.users.current.fetch();
	});
</script>

<svelte:head>
	<title>Chatbox Profiles</title>
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
		<div class="flex w-full flex-wrap justify-center gap-4 p-4 pt-16">
			{#each pageContent.profiles as profile (profile.id)}
				<Card.Root>
					<Card.Content class="p-2">
						<div class="flex flex-col gap-2">
							<div class="flex items-start justify-between">
								<div class="flex flex-col">
									<Card.Title class="max-w-[250px] text-lg font-semibold leading-none"
										>{profile.name}</Card.Title
									>
									<Card.Description
										class="cursor-pointer text-sm text-gray-500 hover:underline"
										onclick={() => {
											searchParams.query = profile.author_id;
										}}>by {profile.author.display_name}</Card.Description
									>
								</div>
							</div>
							<Textarea
								value={profile.preview.trim()}
								rows={6}
								placeholder="Type your template here..."
								class="w-[250px] resize-none text-center"
								readonly
							/>
							<div class="flex gap-2">
								<Button
									variant="outline"
									class="w-full"
									onclick={async () => {
										await api.utils.selectChatboxProfile(profile.id);
										goto(`/chatbox/editor`, { replaceState: true });
									}}
								>
									Select
								</Button>
								{#if currentUser}
									{#if profile.author_id === currentUser!.id || ['Owner', 'Admin', 'Moderator'].some( (i) => currentUser!.system_flags.includes(i) )}
										<Dialog.Root>
											<Dialog.Trigger>
												<Button variant="outline" size="icon" class="text-red-500"
													><Trash2 /></Button
												>
											</Dialog.Trigger>
											<Dialog.Content>
												<Dialog.Header>
													<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
													<Dialog.Description>This action cannot be undone.</Dialog.Description>
												</Dialog.Header>

												<Button
													variant="destructive"
													onclick={async () => {
														api.vrckit.chatboxProfiles.delete(profile.id);
														pageContent.profiles = pageContent.profiles.filter(
															(p) => p.id !== profile.id
														);
													}}>Delete</Button
												>
											</Dialog.Content>
										</Dialog.Root>
									{/if}
								{/if}
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</ScrollArea>
</div>
