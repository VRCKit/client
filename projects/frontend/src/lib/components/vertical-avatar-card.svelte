<script lang="ts">
	import { api } from '$lib/base/api';
	import type { Avatar } from '$lib/base/api/list/VRCKit/Avatars';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import * as Card from '$lib/components/ui/card/index';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import {
		Apple,
		Bot,
		Boxes,
		Copy,
		Grid2X2,
		IdCard,
		Info,
		LibraryBig,
		ReceiptText,
		RefreshCcw,
		SquareArrowOutUpRight,
		Trash2
	} from 'lucide-svelte';
	import AvatarFavoriteButton from './avatar-favorite-button.svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import Highlight from 'svelte-highlight';
	import jsonLang from 'svelte-highlight/languages/json';
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	const {
		avatar,
		search,
		collections = [],
		onFavoriteToggle,
		showDelete = false,
		onDelete,
		showInfo = false,
		info,
		showOpenInLibrary = false,
		extraContextMenuItems,
		imageBottomLeftItems
	}: {
		avatar: Avatar;
		search: (query: string, engine: 'basic' | 'complex') => void;
		collections?: { id: string; name: string }[];
		onFavoriteToggle?: (favorited: boolean) => void;
		showDelete?: boolean;
		onDelete?: () => void;
		showInfo?: boolean;
		info?: string | Snippet<[]>;
		showOpenInLibrary?: boolean;
		extraContextMenuItems?: Snippet<[]>;
		imageBottomLeftItems?: Snippet<[]>;
	} = $props();

	let imageHover = $state(false);

	let platforms = $derived(
		avatar.platforms
			.split(', ')
			.map((i) => {
				const [platform, performance] = i.trim().split(': ');
				return { platform, performance };
			})
			.sort((a, b) => a.platform.localeCompare(b.platform))
	);

	let detailsOpen = $state(false);
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<Card.Root class="relative h-[385px] w-[175px] min-w-[175px]" id="vac_{avatar.id}">
			<Card.Header class="p-3">
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<AspectRatio
								ratio={1 / 1}
								class="bg-muted relative w-full rounded-md"
								onmouseenter={() => (imageHover = true)}
								onmouseleave={() => (imageHover = false)}
							>
								<img
									{...props}
									src={api.utils.avatarImageURL(avatar.id)}
									draggable="false"
									alt="{avatar.name} by {avatar.author_name}"
									class="absolute inset-0 h-full w-full cursor-pointer rounded-md object-cover"
								/>
								<div class="absolute left-1 top-1 flex items-center justify-start gap-1">
									{#each platforms as p}
										<Tooltip.Provider delayDuration={0} disableHoverableContent>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<button
														class="bg-popover text-popover-foreground flex items-center gap-1 rounded-md border p-1"
														onclick={() => {
															search(`platforms*:"${p.platform}"`, 'complex');
															api.toast.success('Searching', {
																duration: 3000,
																description: `Searching for avatars on ${p.platform}.`
															});
														}}
													>
														{#if p.platform === 'StandaloneWindows'}
															<Grid2X2 size={16} />
														{:else if p.platform === 'Android'}
															<Bot size={16} />
														{:else if p.platform === 'IOS'}
															<Apple size={16} />
														{/if}
													</button>
												</Tooltip.Trigger>
												<Tooltip.Content side="bottom" align="start">
													<div class="text-xs font-light">
														{p.platform} ({p.performance})
													</div>
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									{/each}
								</div>
								<div
									data-hover={imageHover}
									class="absolute right-1 top-1 flex -translate-y-2 items-start justify-start gap-1 opacity-0 transition-all data-[hover=true]:translate-y-0 data-[hover=true]:opacity-100"
								>
									{#if showInfo}
										<Tooltip.Provider delayDuration={0} disableHoverableContent>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<button
														class="bg-popover text-popover-foreground flex cursor-pointer items-center gap-1 rounded-md border p-1"
													>
														<Info size={16} />
													</button>
												</Tooltip.Trigger>
												<Tooltip.Content side="bottom">
													{#if typeof info === 'string'}
														{info}
													{:else}
														{@render info!()}
													{/if}
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									{/if}
									<div
										data-hover={imageHover}
										class="flex -translate-y-2 items-center justify-start gap-1 opacity-0 transition-all data-[hover=true]:translate-y-0 data-[hover=true]:opacity-100"
									>
										<AvatarFavoriteButton avatarId={avatar.id} {onFavoriteToggle} />
									</div>
								</div>

								<div
									data-hover={imageHover}
									class="absolute bottom-1 right-1 flex translate-y-2 items-center justify-start gap-1 opacity-0 transition-all data-[hover=true]:translate-y-0 data-[hover=true]:opacity-100"
								>
									{@render imageBottomLeftItems?.()}
									{#if showDelete}
										<Tooltip.Provider delayDuration={0} disableHoverableContent>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<button
														class="bg-popover flex cursor-pointer items-center gap-1 rounded-md border p-1 text-red-500"
														onclick={onDelete}
													>
														<Trash2 size={16} />
													</button>
												</Tooltip.Trigger>
												<Tooltip.Content>Delete</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									{/if}
								</div>
							</AspectRatio>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content style="-webkit-app-region: no-drag;">
						<ContextMenu.Root>
							<ContextMenu.Trigger>
								<img
									src={api.utils.avatarImageURL(avatar.id)}
									draggable="false"
									alt="{avatar.name} by {avatar.author_name}"
									class="h-full w-full rounded-md"
								/>
							</ContextMenu.Trigger>
							<ContextMenu.Content>
								<ContextMenu.Item
									class="flex cursor-pointer items-center gap-2"
									onclick={() => {
										api.shell.openExternal(api.utils.avatarImageURL(avatar.id)!);
									}}
								>
									<SquareArrowOutUpRight size={18} />
									Open in Browser
								</ContextMenu.Item>
								<ContextMenu.Item
									class="flex cursor-pointer items-center gap-2"
									onclick={() => {
										api.utils.copyText(api.utils.avatarImageURL(avatar.id)!);
									}}
								>
									<Copy size={18} />
									Copy Image URL
								</ContextMenu.Item>
							</ContextMenu.Content>
						</ContextMenu.Root>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Header>
			<Card.Content class="flex flex-col gap-1 p-0 px-3">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<h1
								class="line-clamp-2 w-full cursor-default text-start text-xl font-semibold tracking-tight"
							>
								{avatar.name}
							</h1>
						</Tooltip.Trigger>
						<Tooltip.Content class="flex max-w-64 flex-col">
							{avatar.name}
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<div class="flex gap-1 text-sm">
					<Label class="text-sm font-normal text-gray-500">by</Label>
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<button
									class="line-clamp-1 w-full cursor-pointer text-start font-semibold tracking-tight text-gray-400 hover:underline"
									onclick={() => {
										search(`author_id:"${avatar.author_id}"`, 'complex');
										api.toast.success('Searching', {
											duration: 3000,
											description: `Searching for avatars by ${avatar.author_name}`
										});
									}}
								>
									{avatar.author_name}
								</button>
							</Tooltip.Trigger>
							<Tooltip.Content class="flex max-w-64 flex-col">
								{avatar.author_name}
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<p
								class="line-clamp-2 w-full cursor-default text-start text-xs font-light tracking-tight text-gray-400"
							>
								{avatar.description}{avatar.tags ? ` (${avatar.tags})` : ''}
							</p>
						</Tooltip.Trigger>
						<Tooltip.Content class="flex max-w-64 flex-col">
							{avatar.description}{avatar.tags ? ` (${avatar.tags})` : ''}
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
			<Card.Footer class="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-3">
				<Button
					variant="outline"
					size="sm"
					class="h-[30px] w-full"
					onclick={() => {
						api.utils.selectAvatar(avatar.id);
					}}>Select</Button
				>
				<Button
					variant="outline"
					size="default"
					class="w-full"
					onclick={() => {
						goto(`/avatars/library/item?id=${avatar.id}`, { replaceState: true });
					}}>Show Similar</Button
				>
			</Card.Footer>
		</Card.Root>
		<Dialog.Root bind:open={detailsOpen} onOpenChange={(v) => (detailsOpen = v)}>
			<Dialog.Content class="w-[800px] min-w-[800px]" style="-webkit-app-region: no-drag;">
				<Dialog.Header>
					<Dialog.Title>Avatar Details</Dialog.Title>
				</Dialog.Header>
				<ScrollArea orientation="both" class="rounded-md">
					<Highlight language={jsonLang} code={JSON.stringify(avatar, null, 2)} />
				</ScrollArea>
			</Dialog.Content>
		</Dialog.Root>
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item
			class="flex cursor-pointer items-center gap-2"
			onclick={() => (detailsOpen = true)}
		>
			<ReceiptText size={18} />
			Details
		</ContextMenu.Item>
		<ContextMenu.Item
			class="flex cursor-pointer items-center gap-2"
			onclick={async () => {
				api.toast.info('Refreshing Avatar', {
					duration: 1000,
					description: `Re-fetching ${avatar.name} from VRC.`
				});
				await api.systems.cacheScanner.handleNewAvatar(avatar.id, true, true);
				api.toast.success('Avatar Refreshed', {
					duration: 3000,
					description: `Successfully re-fetched ${avatar.name} from VRC.`
				});
			}}
		>
			<RefreshCcw size={18} />
			Re-fetch
		</ContextMenu.Item>
		{#if showOpenInLibrary}
			<ContextMenu.Item
				class="flex cursor-pointer items-center gap-2"
				onclick={() => {
					goto(
						`/avatars/library?query=${encodeURIComponent(`id:"${avatar.id}"`)}&query_engine=complex`
					);
				}}
			>
				<LibraryBig size={18} />
				Open in Library
			</ContextMenu.Item>
		{/if}
		{#if collections.length}
			<ContextMenu.Separator />
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger class="flex cursor-pointer items-center gap-2">
					<Boxes size={18} />
					Add to collection
				</ContextMenu.SubTrigger>
				<ContextMenu.SubContent>
					{#each collections as col}
						<ContextMenu.Item
							class="cursor-pointer"
							onclick={async () => {
								api.toast.info('Adding to collection', {
									duration: 1000,
									description: `Adding ${avatar.name} to ${col.name}`
								});
								const success = await api.vrckit.avatarCollections.items.put(col.id, avatar.id);
								if (success) {
									api.toast.success('Added to collection', {
										duration: 3000,
										description: `Added ${avatar.name} to ${col.name}`
									});
								} else {
									api.toast.error('Failed to add to collection', {
										duration: 3000,
										description: `Failed to add ${avatar.name} to ${col.name}. This might be due to collection is already full.`
									});
								}
							}}
						>
							{col.name}
						</ContextMenu.Item>
					{/each}
				</ContextMenu.SubContent>
			</ContextMenu.Sub>
		{/if}
		{#if extraContextMenuItems}
			{@render extraContextMenuItems!()}
		{/if}
		<ContextMenu.Separator />
		<ContextMenu.Item
			class="flex cursor-pointer items-center gap-2"
			onclick={() => {
				api.utils.copyText(avatar.author_id);
			}}
		>
			<IdCard size={18} />
			Copy Author Id
		</ContextMenu.Item>
		<ContextMenu.Item
			class="flex cursor-pointer items-center gap-2"
			onclick={() => {
				api.utils.copyText(avatar.id);
			}}
		>
			<IdCard size={18} />
			Copy Avatar Id
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
