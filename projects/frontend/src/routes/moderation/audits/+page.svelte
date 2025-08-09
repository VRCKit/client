<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Pagination from '$lib/components/ui/pagination/index';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ChevronsUpDown, IdCard, Plus, RefreshCcw, Search } from 'lucide-svelte';
	import _ from 'lodash';
	import { api } from '$lib/base/api';
	import * as Card from '$lib/components/ui/card/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import Label from '$lib/components/ui/label/label.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import * as Select from '$lib/components/ui/select/index';
	import { onMount } from 'svelte';
	import Minus from '@lucide/svelte/icons/minus';
	import Highlight from 'svelte-highlight';
	import jsonLang from 'svelte-highlight/languages/json';
	import type { Audit } from '$lib/base/api/list/VRCKit/Moderation/Audits';
	import * as Collapsible from '$lib/components/ui/collapsible/index';

	const PerPage = 50;

	let loading = $state(true);

	type SearchParams = {
		page: number;
		types: string[];
		user_id: string;
	};

	let searchParams: SearchParams = $state({
		page: 0,
		types: [],
		user_id: ''
	});

	type PageContent = {
		total_count: number;
		audits: Audit[];
	};

	let pageContent: PageContent = $state({
		audits: [],
		total_count: 0
	});

	async function loadPage() {
		loading = true;
		pageContent = await api.vrckit.moderation.audits.search(
			searchParams.types,
			searchParams.user_id,
			searchParams.page * PerPage,
			PerPage
		);

		loading = false;
	}

	const debouncedLoadPage = _.debounce(loadPage, 250);

	let auditTypes: string[] = $state([]);

	$effect(() => {
		searchParams.page;
		searchParams.types;
		searchParams.user_id;
		debouncedLoadPage();
	});

	onMount(() => {
		api.vrckit.moderation.audits.types().then((types) => {
			auditTypes = types;
		});
	});
</script>

<svelte:head>
	<title>Audit Logs</title>
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
									>Types ({pageContent.total_count.toLocaleString()} results)</Label
								>
								<Select.Root type="single">
									<Select.Trigger
										>Select types ({searchParams.types.length || auditTypes.length} selected)</Select.Trigger
									>
									<Select.Content>
										{#each auditTypes as type}
											<Select.Item
												value={type}
												onclick={async () => {
													if (searchParams.types.includes(type)) {
														searchParams.types = searchParams.types.filter((t) => t !== type);
													} else {
														searchParams.types = [...searchParams.types, type];
													}
												}}
											>
												{#snippet icon()}
													{#if searchParams.types.includes(type)}
														<Minus class="size-4" />
													{:else}
														<Plus class="size-4" />
													{/if}
												{/snippet}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div class="flex flex-1 flex-col gap-2">
								<Label for="user_id">User Id</Label>
								<Input
									id="user_id"
									placeholder="User Id"
									bind:value={searchParams.user_id}
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
			{#each pageContent.audits as audit (audit.id)}
				<ContextMenu.Root>
					<ContextMenu.Trigger class="w-full">
						<Card.Root class="w-full" id="audit_{audit.id}">
							<Card.Content class="w-full p-2">
								<div class="flex items-center justify-between">
									<div class="flex gap-2">
										<img
											src={api.utils.avatarImageURL(audit.user?.selected_avatar_id || '')}
											draggable="false"
											alt="Avatar Image of {audit.user?.display_name || 'Unknown User'}"
											class="h-12 w-12 rounded-md object-cover"
										/>
										<div class="flex flex-col">
											<div class="flex items-center gap-1">
												<Card.Title class="flex items-center gap-1 text-xl">
													{audit.user?.display_name || 'Unknown User'}
												</Card.Title>
												<Card.Description class="flex w-fit gap-1">
													{audit.type} /
													{new Date(audit.created_at).toLocaleString()}
												</Card.Description>
											</div>
											<div class="flex flex-col">
												<Collapsible.Root>
													<Collapsible.Trigger>
														<div
															class="flex cursor-pointer items-center gap-1 text-sm text-gray-400"
														>
															<ChevronsUpDown size={16} /> Details
														</div>
													</Collapsible.Trigger>
													<Collapsible.Content>
														<ScrollArea orientation="both" class="rounded-md">
															<Highlight
																language={jsonLang}
																code={JSON.stringify(audit.data, null, 2)}
															/>
														</ScrollArea>
													</Collapsible.Content>
												</Collapsible.Root>
											</div>
										</div>
									</div>
								</div>
							</Card.Content>
						</Card.Root>
					</ContextMenu.Trigger>
					<ContextMenu.Content>
						{#if audit.user_id}
							<ContextMenu.Item
								class="flex cursor-pointer items-center gap-2"
								onclick={() => {
									api.utils.copyText(audit.user_id!);
								}}
							>
								<IdCard size={18} />
								Copy User Id
							</ContextMenu.Item>
						{/if}
						<ContextMenu.Item
							class="flex cursor-pointer items-center gap-2"
							onclick={() => {
								api.utils.copyText(audit.id);
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
