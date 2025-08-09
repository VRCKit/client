<script lang="ts">
	import { api } from '$lib/base/api';
	import * as Card from '$lib/components/ui/card/index';
	import { onMount } from 'svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import Button from '$lib/components/ui/button/button.svelte';
	import { LockKeyhole, LockKeyholeOpen, Plus, RefreshCcw, Trash2 } from 'lucide-svelte';
	import type { AvatarProfile } from '$lib/base/api/list/VRCKit/AvatarProfiles';
	import _ from 'lodash';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import CreateAvatarProfileDialogContent from '$lib/components/create-avatar-profile-dialog-content.svelte';

	const PerPage = 50;

	let currentAvatarId: string | null = $state(null);

	let loading = $state(true);

	type SearchParams = {
		page: number;
		query: string;
		only_private: boolean;
	};

	let searchParams: SearchParams = $state({
		page: 0,
		query: '',
		only_private: false
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
		if (!searchParams.query) {
			pageContent = { profiles: [], total_count: 0 };
			loading = false;
			return;
		}
		pageContent = await api.vrckit.avatarProfiles.search(
			searchParams.query,
			searchParams.page * PerPage,
			PerPage,
			searchParams.only_private
		);

		loading = false;
	}

	const debouncedLoadPage = _.debounce(loadPage, 250);

	let currentUser: CurrentUser | null = $state(null);

	onMount(() => {
		currentAvatarId = api.utils.currentAvatarId;
		searchParams.query = api.utils.currentAvatarId || '';

		api.vrckit.users.current.fetch().then((user) => {
			currentUser = user;
		});

		function handleAvatarSelectSuccess({ id }: { id: string }) {
			currentAvatarId = id;
			searchParams.query = id;
		}

		api.events.on('AvatarSelectSuccess', handleAvatarSelectSuccess);
		return () => {
			api.events.off('AvatarSelectSuccess', handleAvatarSelectSuccess);
		};
	});

	$effect(() => {
		searchParams.page;
		searchParams.query;
		searchParams.only_private;
		debouncedLoadPage();
	});

	let createDialogOpen = $state(false);
</script>

<svelte:head>
	<title>Avatar Profiles</title>
</svelte:head>

<div class="relative w-full">
	<ScrollArea class="h-full w-full">
		<div
			class="fixed z-10 flex w-[var(--full-width)] items-center justify-between bg-black bg-opacity-75 p-2"
		>
			<div class="flex items-center gap-2">
				<Tooltip.Provider delayDuration={0} disableCloseOnTriggerClick>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="outline"
								size="icon"
								onclick={() => (searchParams.only_private = !searchParams.only_private)}
							>
								{#if loading}
									<RefreshCcw class="animate-spin" />
								{:else if searchParams.only_private}
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
				<Dialog.Root open={createDialogOpen} onOpenChange={(v) => (createDialogOpen = v)}>
					<Dialog.Trigger>
						<Tooltip.Provider delayDuration={0}>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button variant="outline" size="icon">
										<Plus />
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>Create a new profile</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</Dialog.Trigger>
					<Dialog.Content>
						<CreateAvatarProfileDialogContent
							onClose={() => {
								createDialogOpen = false;
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
			<Card.Root class="w-full">
				<Card.Content class="w-full">
					<div class="flex gap-6">
						<div class="flex h-[75px] w-[75px] min-w-[75px]">
							<img
								src={api.utils.avatarImageURL(currentAvatarId)}
								draggable="false"
								alt="Current Avatar"
								class="h-full w-full rounded-md object-cover"
							/>
						</div>
						<div class="flex flex-col gap-1">
							<Card.Title>Current Avatar Profiles</Card.Title>
							<Card.Description>
								You can view other's and yours avatar profiles here. And create your own avatar
								profile.
							</Card.Description>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
		<div class="flex w-full flex-col gap-2 p-4 pt-2">
			{#if pageContent.total_count === 0}
				<div class="flex w-full flex-1 flex-col items-center justify-center gap-1 p-4">
					<h1 class="cursor-default text-xl font-semibold">No results was found</h1>
					<p class="cursor-default text-gray-500">
						Try creating your own profile or select another avatar.
					</p>
				</div>
			{/if}
			{#each pageContent.profiles as profile (profile.id)}
				<Card.Root>
					<Card.Content class="p-2">
						<div class="flex items-center justify-between">
							<div class="flex flex-col">
								<Card.Title class="text-lg">{profile.name}</Card.Title>
								<Card.Description class="flex gap-1">
									by <div class="font-semibold">{profile.author.display_name}</div>
								</Card.Description>
							</div>
							<div class="flex gap-2">
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
														pageContent.profiles = pageContent.profiles.filter(
															(p) => p.id !== profile.id
														);
														await api.vrckit.avatarProfiles.delete(profile.id);
													}}>Delete</Button
												>
											</Dialog.Content>
										</Dialog.Root>
									{/if}
								{/if}

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
			{/each}
		</div>
	</ScrollArea>
</div>
