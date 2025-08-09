<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import Button from '$lib/components/ui/button/button.svelte';
	import { IdCard, Plus, ReceiptText, RefreshCcw, Search, Trash2 } from 'lucide-svelte';
	import _ from 'lodash';
	import { api } from '$lib/base/api';
	import * as Card from '$lib/components/ui/card/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import type { ModerationUser } from '$lib/base/api/list/VRCKit/Moderation/Users';
	import * as Select from '$lib/components/ui/select/index';
	import { onMount } from 'svelte';
	import Minus from '@lucide/svelte/icons/minus';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import Highlight from 'svelte-highlight';
	import jsonLang from 'svelte-highlight/languages/json';

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
		online_count: number;
		users: ModerationUser[];
	};

	let pageContent: PageContent = $state({
		users: [],
		online_count: 0,
		total_count: 0
	});

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.moderation.users.search(
			searchParams.query,
			searchParams.page * PerPage,
			PerPage
		);

		loading = false;
	}

	const debouncedLoadPage = _.debounce(loadPage, 250);

	let userFlags: string[] = $state([]);

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
		api.vrckit.moderation.users.systemFlags().then((flags) => {
			userFlags = flags;
		});
	});

	let userDetailsOpen = $state<Record<string, boolean>>({});
</script>

<svelte:head>
	<title>Moderate Users</title>
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
					<div class="flex gap-1">
						<span class="font-semibold text-gray-300"
							>{pageContent.online_count}/{pageContent.total_count}</span
						>
						<span class="font-light text-gray-200">users online.</span>
					</div>
				</Popover.Root>
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
			{#each pageContent.users as user (user.id)}
				<ContextMenu.Root>
					<ContextMenu.Trigger class="w-full">
						<Card.Root class="w-full" id="usr_{user.id}">
							<Card.Content class="w-full p-2">
								<div class="flex items-center justify-between">
									<div class="flex gap-2">
										<img
											src={api.utils.avatarImageURL(user.selected_avatar_id)}
											draggable="false"
											alt="Avatar Image of {user.display_name}"
											class="h-12 w-12 rounded-md object-cover"
										/>
										<div class="flex flex-col">
											<div class="flex items-center gap-1">
												<Card.Title class="flex items-center gap-1 text-xl">
													{user.display_name}
													{#if Date.now() - new Date(user.updated_at).getTime() < 90000}
														<div class="h-2 w-2 rounded-full bg-green-500"></div>
													{/if}
												</Card.Title>
												<Card.Description
													class="flex w-fit gap-1 opacity-0 transition-opacity hover:opacity-100"
												>
													{user.email}
												</Card.Description>
											</div>
											<div class="flex flex-col">
												<Card.Description class="flex gap-1 text-xs leading-none text-gray-500">
													Created at <div class="font-semibold">
														{new Date(user.created_at).toLocaleString()}
													</div>
												</Card.Description>
												<Card.Description class="flex gap-1 text-xs leading-none text-gray-500">
													Updated at <div class="font-semibold">
														{new Date(user.updated_at).toLocaleString()}
													</div>
												</Card.Description>
											</div>
										</div>
									</div>
									<div class="flex gap-2">
										{#if currentUser && ['Owner', 'Admin'].some( (flag) => currentUser!.system_flags.includes(flag) )}
											<Select.Root type="single">
												<Select.Trigger>Flags</Select.Trigger>
												<Select.Content>
													{#each userFlags as flag}
														<Select.Item
															value={flag}
															onclick={async () => {
																if (user.system_flags.includes(flag)) {
																	user.system_flags = user.system_flags.filter((f) => f !== flag);
																	const res = await api.vrckit.moderation.users.deleteSystemFlag(
																		user.id,
																		flag
																	);
																	if (res.error) {
																		api.toast.error('Unable to remove flag', {
																			description: res.error
																		});
																	} else {
																		api.toast.success('Flag removed');
																	}
																} else {
																	user.system_flags = [...user.system_flags, flag];
																	const res = await api.vrckit.moderation.users.putSystemFlag(
																		user.id,
																		flag
																	);
																	if (res.error) {
																		api.toast.error('Unable to add flag', {
																			description: res.error
																		});
																	} else {
																		api.toast.success('Flag added');
																	}
																}
															}}
														>
															{#snippet icon()}
																{#if user.system_flags.includes(flag)}
																	<Minus class="size-4" />
																{:else}
																	<Plus class="size-4" />
																{/if}
															{/snippet}
														</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										{/if}
										{#if currentUser && currentUser.id !== user.id && currentUser.system_flags.includes('Owner')}
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
															pageContent.users = pageContent.users.filter((u) => u.id !== user.id);
															await api.vrckit.moderation.users.delete(user.id);
															api.toast.success('User deleted');
														}}>Delete</Button
													>
												</Dialog.Content>
											</Dialog.Root>
										{/if}
									</div>
								</div>
							</Card.Content>
						</Card.Root>
						<Dialog.Root
							open={userDetailsOpen[user.id]}
							onOpenChange={(v) => (userDetailsOpen[user.id] = v)}
						>
							<Dialog.Content class="w-[800px] min-w-[800px]" style="-webkit-app-region: no-drag;">
								<Dialog.Header>
									<Dialog.Title>User Details</Dialog.Title>
								</Dialog.Header>
								<ScrollArea orientation="both" class="rounded-md">
									<Highlight language={jsonLang} code={JSON.stringify(user, null, 2)} />
								</ScrollArea>
							</Dialog.Content>
						</Dialog.Root>
					</ContextMenu.Trigger>
					<ContextMenu.Content>
						<ContextMenu.Item
							class="flex cursor-pointer items-center gap-2"
							onclick={() => (userDetailsOpen[user.id] = true)}
						>
							<ReceiptText size={18} />
							Details
						</ContextMenu.Item>
						<ContextMenu.Separator />
						<ContextMenu.Item
							class="flex cursor-pointer items-center gap-2"
							onclick={() => {
								api.utils.copyText(user.id);
							}}
						>
							<IdCard size={18} />
							Copy Id
						</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			{/each}
		</div>
	</ScrollArea>
</div>
