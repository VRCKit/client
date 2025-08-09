<script lang="ts">
	import { api } from '$lib/base/api';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import * as Card from '$lib/components/ui/card/index';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { Blocks, IdCard, ReceiptText } from 'lucide-svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import Highlight from 'svelte-highlight';
	import jsonLang from 'svelte-highlight/languages/json';
	import { goto } from '$app/navigation';
	import type { AvatarCollection } from '$lib/base/api/list/VRCKit/AvatarCollections';
	import { onMount } from 'svelte';
	import MultiAvatarImage from './multi-avatar-image.svelte';

	const {
		collection,
		search
	}: {
		collection: AvatarCollection;
		search: (query: string) => void;
	} = $props();

	let imageHover = $state(false);
	let detailsOpen = $state(false);

	let imageAvatarIds: string[] = $state([]);

	onMount(() => {
		if (!collection.image_avatar_id) {
			api.vrckit.avatarCollections.items
				.search(collection.id, '', 0, 4, 'basic')
				.then((res) => {
					imageAvatarIds = res.items.map((item) => item.id);
				})
				.catch((err) => {});
		} else {
			imageAvatarIds = [collection.image_avatar_id];
		}
	});
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<Card.Root class="relative h-[355px] w-[175px] min-w-[175px]" id="vacc_{collection.id}">
			<Card.Header class="p-3">
				<AspectRatio
					ratio={1 / 1}
					class="bg-muted relative w-full rounded-md"
					onmouseenter={() => (imageHover = true)}
					onmouseleave={() => (imageHover = false)}
				>
					<MultiAvatarImage
						avatarIds={imageAvatarIds}
						alt="{collection.name} by {collection.author.display_name}"
					/>
					<button
						class="bg-popover text-popover-foreground absolute bottom-1 left-1 flex cursor-default items-center gap-1 rounded-md border px-2 py-1 transition-all"
					>
						<Blocks size={18} />
						<div class="truncate text-xs font-light">
							{collection.avatar_count}
							avatars
						</div>
					</button>
				</AspectRatio>
			</Card.Header>
			<Card.Content class="flex flex-col gap-1 p-0 px-3">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<h1
								class="line-clamp-2 w-full cursor-default text-start text-xl font-semibold tracking-tight"
							>
								{collection.name}
							</h1>
						</Tooltip.Trigger>
						<Tooltip.Content class="flex max-w-64 flex-col">
							{collection.name}
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
										search(collection.author_id);
										api.toast.success('Searching', {
											duration: 3000,
											description: `Searching for collections by ${collection.author.display_name}`
										});
									}}
								>
									{collection.author.display_name}
								</button>
							</Tooltip.Trigger>
							<Tooltip.Content class="flex max-w-64 flex-col">
								{collection.author.display_name}
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
								{collection.description}{collection.tags ? ` (${collection.tags})` : ''}
							</p>
						</Tooltip.Trigger>
						<Tooltip.Content class="flex max-w-64 flex-col">
							{collection.description}{collection.tags ? ` (${collection.tags})` : ''}
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
			<Card.Footer class="absolute bottom-0 left-0 right-0 p-3">
				<Button
					variant="outline"
					class="w-full"
					onclick={() => {
						goto(`/avatars/collections/item?id=${collection.id}`, { replaceState: true });
					}}
				>
					View
				</Button>
			</Card.Footer>
		</Card.Root>
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
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item
			class="flex cursor-pointer items-center gap-2"
			onclick={() => (detailsOpen = true)}
		>
			<ReceiptText size={18} />
			Details
		</ContextMenu.Item>
		<ContextMenu.Separator />
		<ContextMenu.Item
			class="flex cursor-pointer items-center gap-2"
			onclick={() => {
				api.utils.copyText(collection.author_id);
			}}
		>
			<IdCard size={18} />
			Copy Author Id
		</ContextMenu.Item>
		<ContextMenu.Item
			class="flex cursor-pointer items-center gap-2"
			onclick={() => {
				api.utils.copyText(collection.id);
			}}
		>
			<IdCard size={18} />
			Copy Collection Id
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
