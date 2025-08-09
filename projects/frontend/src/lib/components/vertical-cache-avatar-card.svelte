<script lang="ts">
	import { api } from '$lib/base/api';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import * as Card from '$lib/components/ui/card/index';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { Apple, Bot, Grid2X2, IdCard, LibraryBig, ReceiptText } from 'lucide-svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import Highlight from 'svelte-highlight';
	import jsonLang from 'svelte-highlight/languages/json';
	import type { DatabaseAvatar } from '$lib/base/api/list/Database/Avatars';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const {
		avatar,
		search
	}: {
		avatar: DatabaseAvatar;
		search: (query: string) => void;
	} = $props();

	let platforms = $derived(
		avatar.platforms
			.split(', ')
			.map((i) => {
				const [platform, performance] = i.trim().split(': ');
				return { platform, performance };
			})
			.sort((a, b) => a.platform.localeCompare(b.platform))
	);

	let imageUrl = $state('#');

	onMount(() => {
		api.vrchat
			.fetch({
				method: 'HEAD',
				url: avatar.image_url
			})
			.then((req) => {
				if (req.status === 200) {
					imageUrl = req.url;
				} else {
					imageUrl = api.utils.avatarImageURL(avatar.id)!;
				}
			})
			.catch(() => {
				imageUrl = api.utils.avatarImageURL(avatar.id)!;
			});
	});

	let detailsOpen = $state(false);
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<Card.Root class="relative h-[355px] w-[175px] min-w-[175px]" id="vac_{avatar.id}">
			<Card.Header class="p-3">
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<AspectRatio ratio={1 / 1} class="bg-muted relative w-full rounded-md">
								<img
									{...props}
									src={imageUrl}
									draggable="false"
									alt="{avatar.name} by {avatar.author_name}"
									class="absolute inset-0 h-full w-full cursor-pointer rounded-md object-cover"
								/>
								<div class="absolute left-1 top-1 flex items-center justify-start gap-1">
									{#each platforms as p}
										<Tooltip.Provider delayDuration={0} disableHoverableContent>
											<Tooltip.Root>
												<Tooltip.Trigger>
													<div
														class="bg-popover text-popover-foreground flex cursor-default items-center gap-1 rounded-md border p-1"
													>
														{#if p.platform === 'StandaloneWindows'}
															<Grid2X2 size={16} />
														{:else if p.platform === 'Android'}
															<Bot size={16} />
														{:else if p.platform === 'IOS'}
															<Apple size={16} />
														{/if}
													</div>
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
							</AspectRatio>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content style="-webkit-app-region: no-drag;">
						<img
							src={imageUrl}
							draggable="false"
							alt="{avatar.name} by {avatar.author_name}"
							class="h-full w-full rounded-md"
						/>
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
										search(avatar.author_id);
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
			<Card.Footer class="absolute bottom-0 left-0 right-0 p-3">
				<Button
					variant="outline"
					class="w-full"
					onclick={() => {
						api.utils.selectAvatar(avatar.id);
					}}>Select</Button
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
