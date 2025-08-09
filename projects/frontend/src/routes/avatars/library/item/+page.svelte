<script lang="ts">
	import { page } from '$app/state';
	import { api } from '$lib/base/api';
	import type { Avatar } from '$lib/base/api/list/VRCKit/Avatars';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Select from '$lib/components/ui/select/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import * as Card from '$lib/components/ui/card/index';
	import { goto } from '$app/navigation';
	import VerticalAvatarCard from '$lib/components/vertical-avatar-card.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import AvatarFavoriteButton from '$lib/components/avatar-favorite-button.svelte';
	import {
		Bomb,
		EllipsisVertical,
		Flag,
		LibraryBig,
		Minus,
		Plus,
		RefreshCcw,
		Search,
		Trash2
	} from 'lucide-svelte';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { onMount } from 'svelte';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import ReportAvatarDialogContent from '$lib/components/report-avatar-dialog-content.svelte';
	import { randomPickAmount } from '$lib/utils';
	import randomInteger from 'stuffs/lib/randomInteger';
	import AvatarCardList from '$lib/components/avatar-card-list.svelte';

	let currentUser: CurrentUser | null = $state(null);

	let avatar: Avatar | null = $state(null);
	let allTags: { tag: string; key: string; picked: boolean }[] = $state([]);
	let recommendedAvatars: Avatar[] = $state([]);
	let lastRecommendQuery: string = $state('');
	let loading = $state(false);

	let myAvatarCollections: {
		id: string;
		name: string;
		selected: boolean;
	}[] = $state([]);

	async function fetchAvatar() {
		document.querySelector('#avatar-page')?.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});

		api.vrckit.users.current.avatarCollections
			.fetchAvatar(page.url.searchParams.get('id')!)
			.then((collections) => {
				myAvatarCollections = collections.map(({ collection, contains }) => ({
					id: collection.id,
					name: collection.name,
					selected: contains
				}));
			});

		loading = true;
		avatar = await api.vrckit.avatars.fetch(page.url.searchParams.get('id')!);

		let tags = [
			...avatar.tags.split(', ').map((tag) => ({ tag, key: 'tags' })),
			...avatar.ai_tags.split(', ').map((tag) => ({ tag, key: 'ai_tags' })),
			...avatar.ai_tags_v2.split(', ').map((tag) => ({ tag, key: 'ai_tags_v2' }))
		].filter((t) => t.tag.trim() !== '');
		tags = tags
			.filter((t, idx) => tags.findIndex((j) => j.tag === t.tag) === idx)
			.sort((a, b) => a.tag.localeCompare(b.tag));
		allTags = tags.map((t) => ({
			...t,
			picked: false
		}));

		await recommendAvatars();

		loading = false;
	}

	async function recommendAvatars() {
		if (!avatar) return;
		loading = true;
		if (allTags.length) {
			recommendedAvatars = [];
			const randomTags = randomPickAmount(allTags, 8);
			const query = `@tags ${randomTags.map((t) => t.tag).join(', ')}`;
			lastRecommendQuery = query;
			allTags.forEach((t) => {
				t.picked = randomTags.some((j) => j.tag === t.tag);
			});

			let avatars = (
				await api.vrckit.avatars.search(query, 0, 100, 'redis', `created_at`, 'desc', false)
			).avatars;
			recommendedAvatars = avatars;
		}
		loading = false;
	}

	$effect(() => {
		if (page.url.searchParams.get('id')) {
			fetchAvatar();
		}
	});

	onMount(() => {
		api.vrckit.users.current.fetch().then((c) => {
			currentUser = c;
		});
	});

	let reportDialogOpen = $state(false);
</script>

<ScrollArea class="h-full w-full">
	{#if avatar}
		<div class="flex w-full flex-col gap-4 p-4" id="avatar-page">
			<div
				class="relative h-[300px] w-[100%] rounded-lg"
				style="background-image: url('{api.utils.avatarImageURL(
					avatar!.id
				)}'), url('{api.utils.avatarImageURL(
					avatar!.id
				)}'); background-position: center; background-size: contain, cover; background-repeat: no-repeat;"
			>
				<div class="absolute right-2 top-2">
					<Popover.Root>
						<Popover.Trigger>
							<Button variant="outline" size="icon">
								<EllipsisVertical />
							</Button>
						</Popover.Trigger>
						<Popover.Content class="flex flex-col" side="bottom" align="end">
							<div class="flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<Dialog.Root
										open={reportDialogOpen}
										onOpenChange={(open) => (reportDialogOpen = open)}
									>
										<Dialog.Trigger class="w-full">
											<Button variant="default" class="w-full">
												<Flag />
												Report
											</Button>
										</Dialog.Trigger>
										<Dialog.Content>
											<ReportAvatarDialogContent
												avatarId={avatar.id}
												onClose={() => {
													reportDialogOpen = false;
												}}
											/>
										</Dialog.Content>
									</Dialog.Root>
								</div>
								{#if currentUser && (currentUser!.id === avatar.uploader_id || ['Owner', 'Admin', 'Moderator'].some( (i) => currentUser!.system_flags.includes(i) ))}
									<div class="flex items-center gap-2">
										<Button
											onclick={async () => {
												api.toast.info('Deleting avatar..', { duration: 1000 });
												await api.vrckit.avatars.delete(avatar!.id);
												api.toast.success('Avatar deleted.', {
													description: `The avatar ${avatar!.name} has been deleted.`,
													duration: 3000
												});
												goto('/avatars/library', { replaceState: true });
											}}
											variant="destructive"
											class="w-full"
										>
											<Trash2 />
											Delete
										</Button>

										<Button
											disabled={!['Owner', 'Admin'].some((i) =>
												currentUser!.system_flags.includes(i)
											)}
											onclick={async () => {
												api.toast.info('Blocking avatar..', { duration: 1000 });
												await api.vrckit.avatars.delete(avatar!.id, true);
												api.toast.success('Avatar blocked.', {
													description: `The avatar ${avatar!.name} has been blocked.`,
													duration: 3000
												});
												goto('/avatars/library', { replaceState: true });
											}}
											variant="destructive"
											class="w-full"
										>
											<Bomb />
											Block
										</Button>
									</div>
								{/if}
							</div>
						</Popover.Content>
					</Popover.Root>
				</div>
			</div>
			<Card.Root>
				<Card.Content class="p-2">
					<div class="flex flex-col gap-2">
						<Card.Title>{avatar.name}</Card.Title>
						<Card.Description class="flex flex-col gap-2">
							<div class="flex gap-1">
								by <a
									class="font-semibold hover:underline"
									href="/avatars/library?query={encodeURIComponent(
										`author_id:"${avatar.author_id}"`
									)}&query_engine=complex">{avatar.author_name}</a
								>
							</div>
							<div class="flex gap-1">
								{avatar.description}
							</div>
							<div class="flex flex-wrap gap-1">
								{#each allTags as tag, idx}
									<a
										href="/avatars/library?query={encodeURIComponent(
											`@tags ${tag.tag}`
										)}&query_engine=redis"
									>
										<button
											class="cursor-pointer rounded-full border px-2 py-1 text-sm font-semibold text-gray-200 hover:underline {tag.picked
												? 'border-gray-500'
												: ''}"
										>
											{api.utils.formatTagName(tag.tag)}
										</button>
									</a>
								{/each}
							</div>
							<div class="flex gap-1">
								<Button
									variant="outline"
									class="w-full text-white"
									onclick={() => {
										api.utils.selectAvatar(avatar!.id);
									}}>Select</Button
								>
								<Select.Root type="single">
									<Select.Trigger class="w-[200px]">Add to collection</Select.Trigger>
									<Select.Content>
										{#each myAvatarCollections as col}
											<Select.Item
												value={col.id}
												onclick={async () => {
													api.toast.info('Adding to collection', {
														duration: 1000,
														description: `Adding ${avatar!.name} to ${col.name}`
													});
													col.selected = !col.selected;
													if (col.selected) {
														const success = await api.vrckit.avatarCollections.items.put(
															col.id,
															avatar!.id
														);
														if (success) {
															api.toast.success('Added to collection', {
																duration: 3000,
																description: `Added ${avatar!.name} to ${col.name}`
															});
														} else {
															api.toast.error('Failed to add to collection', {
																duration: 3000,
																description: `Failed to add ${avatar!.name} to ${col.name}. This might be due to collection is already full.`
															});
														}
													} else {
														const success = await api.vrckit.avatarCollections.items.delete(
															col.id,
															avatar!.id
														);
														if (success) {
															api.toast.success('Removed from collection', {
																duration: 3000,
																description: `Removed ${avatar!.name} from ${col.name}`
															});
														} else {
															api.toast.error('Failed to remove from collection', {
																duration: 3000,
																description: `Failed to remove ${avatar!.name} from ${col.name}`
															});
														}
													}
												}}
											>
												{#snippet icon()}
													{#if col.selected}
														<Minus class="size-4" />
													{:else}
														<Plus class="size-4" />
													{/if}
												{/snippet}
												{col.name}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								<AvatarFavoriteButton avatarId={avatar.id} class="h-10 w-10" />
							</div>
						</Card.Description>
					</div>
				</Card.Content>
			</Card.Root>
			<div class="flex w-full flex-col gap-4">
				<div class="flex items-start justify-between">
					<div class="flex flex-col">
						<h2 class="flex items-center gap-2 text-lg font-semibold">Recommended Avatars</h2>
						<p class="text-sm text-gray-400">
							Based on the tags of this avatar, we recommend these avatars.
						</p>
					</div>
					<div class="flex items-center gap-2">
						<Button variant="outline" size="icon" disabled={loading} onclick={recommendAvatars}>
							<RefreshCcw class={loading ? 'animate-spin' : ''} />
						</Button>
						<Button
							variant="outline"
							disabled={loading}
							onclick={() => {
								goto(
									`/avatars/library?query=${encodeURIComponent(lastRecommendQuery)}&query_engine=complex`,
									{
										replaceState: true
									}
								);
							}}
						>
							<Search size={24} /> See All
						</Button>
					</div>
				</div>
				<div class="flex w-full flex-wrap justify-center gap-4">
					<AvatarCardList avatars={recommendedAvatars}>
						{#snippet card({ avatar })}
							<VerticalAvatarCard
								{avatar}
								search={(query, engine) => {
									goto(
										`/avatars/library?query=${encodeURIComponent(query)}&query_engine=${engine}`,
										{
											replaceState: true
										}
									);
								}}
							>
								{#snippet extraContextMenuItems()}
									<ContextMenu.Separator />
									<ContextMenu.Item
										class="flex cursor-pointer items-center gap-2"
										onclick={() => {
											goto(
												`/avatars/library?query=${encodeURIComponent(`id:"${avatar.id}"`)}&query_engine=complex`,
												{ replaceState: true }
											);
										}}
									>
										<LibraryBig size={18} />
										Open in Library
									</ContextMenu.Item>
								{/snippet}
							</VerticalAvatarCard>
						{/snippet}
					</AvatarCardList>
				</div>
			</div>
		</div>
	{/if}
</ScrollArea>
