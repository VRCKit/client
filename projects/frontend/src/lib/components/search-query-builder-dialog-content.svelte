<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index';
	import * as Select from '$lib/components/ui/select/index';
	import { api } from '$lib/base/api';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import {
		ArrowDownNarrowWide,
		ArrowUpWideNarrow,
		Hash,
		ListFilter,
		ListStart,
		Search
	} from 'lucide-svelte';
	import { debounce } from 'lodash';
	import type { AvatarTag } from '$lib/base/api/list/VRCKit/AvatarTags';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import { onMount } from 'svelte';

	const SortByTypes = [
		{
			key: 'created_at',
			name: 'Created At'
		},
		{
			key: 'updated_at',
			name: 'Updated At'
		},
		{
			key: 'avatar_created_at',
			name: 'Avatar Created At'
		},
		{
			key: 'avatar_updated_at',
			name: 'Avatar Updated At'
		},
		{
			key: 'name',
			name: 'Name'
		}
	];

	let searchMode = $state<'Tags' | 'FullText' | 'Complex'>('FullText');
	let platform = $state<'StandaloneWindows' | 'Android' | 'iOS' | 'All'>('All');
	let sortBy = $state<
		'created_at' | 'updated_at' | 'avatar_created_at' | 'avatar_updated_at' | 'name'
	>('created_at');
	let sortByDirection = $state<'asc' | 'desc'>('desc');
	let loading = $state(false);
	let search = $state<string>('');

	let tags = $state<AvatarTag[]>([]);
	let localTags = $state<string[]>([]);

	let ignoreHistorySave = $state(true);

	let buildQuery = $derived.by(() => {
		switch (searchMode) {
			case 'Tags':
				if (localTags.length === 0) return '';
				return `@tags ${localTags.join(', ')}${platform !== 'All' ? `; @platforms:(${platform})` : ''}`.trim();
			case 'FullText':
				return `${search.trim()}${platform !== 'All' ? ` @platforms:(${platform})` : ''}`.trim();
			case 'Complex':
				return `${search.trim()}${platform !== 'All' ? ` platforms*:"${platform}"` : ''}`.trim();
			default:
				return '';
		}
	});

	let {
		onSearch,
		title = 'Search Query Builder',
		features = ['Sorting'],
		key = 'QueryBuilder'
	}: {
		onSearch: (search: string, engine: string, sorting: string, force: boolean) => void;
		title?: string;
		search?: string;
		features?: 'Sorting'[];
		key?: string;
	} = $props();

	async function extractTags() {
		loading = true;

		if (search) {
			const splitted = search
				.split(/,| /)
				.map((tag) => tag.trim().toLowerCase())
				.filter((tag) => tag.length > 0);
			localTags = splitted;
			tags = await api.vrckit.avatarTags.extract(splitted.at(-1) ?? '');
		} else {
			tags = [];
			localTags = [];
		}

		loading = false;
	}

	const debouncedExtractTags = debounce(extractTags, 100);

	$effect(() => {
		if (searchMode === 'Tags' && search) {
			debouncedExtractTags();
		} else {
			tags = [];
		}
	});

	$effect(() => {
		search;
		debouncedExtractTags();
	});

	$effect(() => {
		if (ignoreHistorySave) return;
		api.database.keyValues.set(`SearchQueryBuilder;History;${key}`, {
			search,
			search_mode: searchMode,
			platform,
			sort_by: sortBy,
			sort_by_direction: sortByDirection
		});
	});

	onMount(async () => {
		const history = await api.database.keyValues.get<any>(`SearchQueryBuilder;History;${key}`);
		if (history) {
			search = history.search ?? '';
			searchMode = history.search_mode ?? 'FullText';
			platform = history.platform ?? 'All';
			sortBy = history.sort_by ?? 'created_at';
			sortByDirection = history.sort_by_direction ?? 'desc';
		}
	});
</script>

<Dialog.Header>
	<Dialog.Title>{title}</Dialog.Title>
	<Dialog.Description>Please specify the search query you want to build.</Dialog.Description>
</Dialog.Header>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_mouse_events_have_key_events -->
<div
	class="flex flex-col gap-2"
	onmouseenter={() => {
		if (ignoreHistorySave) ignoreHistorySave = false;
	}}
>
	<div class="flex gap-2">
		<div class="flex w-full flex-col gap-1">
			<Label for="name">Search</Label>
			<div class="relative w-full">
				{#if searchMode !== 'Tags'}
					<Input id="search" bind:value={search} maxlength={128} placeholder="Search." />
				{:else}
					<Popover.Root>
						<Popover.Trigger class="w-full">
							<Input id="search" bind:value={search} maxlength={128} placeholder="Search." />
						</Popover.Trigger>
						<Popover.Content
							align="start"
							trapFocus={false}
							escapeKeydownBehavior="defer-otherwise-ignore"
						>
							<ScrollArea class="flex max-h-48 flex-col gap-1">
								{#each tags.filter((tag) => !localTags.includes(tag.tag)) as tag}
									<button
										class="hover:bg-accent flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1"
										onclick={() => {
											search =
												search
													.split(/,| /)
													.map((t) => t.trim())
													.filter((t) => t.length > 0)
													.slice(0, !search.endsWith(' ') ? -1 : undefined)
													.concat(tag.tag)
													.join(' ') + ' ';
											document.getElementById('search')?.focus();
										}}
									>
										<div class="flex flex-col items-start">
											<span class="text-start font-bold">{api.utils.formatTagName(tag.tag)}</span>
											<code class="text-xs">{tag.tag}</code>
										</div>
										<span class="rounded-full border px-2 py-1 text-xs">{tag.count}</span>
									</button>
								{/each}
							</ScrollArea>
						</Popover.Content>
					</Popover.Root>
				{/if}
			</div>
		</div>
		<div class="flex min-w-[40px] flex-col items-start gap-1">
			<Label>Mode</Label>
			<Tooltip.Provider delayDuration={0} disableCloseOnTriggerClick>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="outline"
							size="icon"
							onclick={() => {
								const currentIndex = ['Tags', 'FullText', 'Complex'].indexOf(searchMode);
								searchMode = ['Tags', 'FullText', 'Complex'][(currentIndex + 1) % 3] as
									| 'Tags'
									| 'FullText'
									| 'Complex';
							}}
						>
							{#if searchMode === 'Tags'}
								<Hash />
							{:else if searchMode === 'FullText'}
								<ListStart />
							{:else if searchMode === 'Complex'}
								<ListFilter />
							{/if}
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content class="flex flex-col">
						<div class="font-semibold">Search Mode:</div>
						<div class="text-sm text-gray-500">
							{searchMode === 'Tags'
								? 'Search by tags. With auto-complete.'
								: searchMode === 'FullText'
									? 'Search by full text.'
									: 'Search by complex query.'}
						</div>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>
	</div>
	<div class="flex gap-2">
		<div class="flex w-full flex-col gap-1">
			<Label for="platform">Platform</Label>
			<Select.Root type="single" bind:value={platform}>
				<Select.Trigger>
					{#if platform === 'StandaloneWindows'}
						Windows (Desktop)
					{:else if platform === 'Android'}
						Android (Quest)
					{:else if platform === 'iOS'}
						iOS
					{:else}
						All Platforms
					{/if}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="All">All Platforms</Select.Item>
					<Select.Item value="StandaloneWindows">Windows (Desktop)</Select.Item>
					<Select.Item value="Android">Android (Quest)</Select.Item>
					<Select.Item value="iOS">iOS</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
		<div class="flex w-[300px] flex-col gap-1">
			<Label for="Sort By">Sort By</Label>
			<Select.Root type="single" bind:value={sortBy} disabled={!features.includes('Sorting')}>
				<Select.Trigger>{SortByTypes.find((i) => i.key === sortBy)!.name}</Select.Trigger>
				<Select.Content>
					{#each SortByTypes as type}
						<Select.Item value={type.key}>{type.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="flex min-w-[40px] flex-col items-start gap-1">
			<Label>Order</Label>
			<Tooltip.Provider delayDuration={0} disableCloseOnTriggerClick>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button
							variant="outline"
							size="icon"
							onclick={() => (sortByDirection = sortByDirection === 'asc' ? 'desc' : 'asc')}
							disabled={!features.includes('Sorting')}
						>
							{#if sortByDirection === 'asc'}
								<ArrowDownNarrowWide />
							{:else}
								<ArrowUpWideNarrow />
							{/if}
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content class="flex flex-col">
						<div class="font-semibold">Sort Order:</div>
						<div class="text-sm text-gray-500">
							{sortByDirection === 'asc' ? 'Ascending' : 'Descending'}
						</div>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		</div>
	</div>
	<div class="flex gap-2">
		<div class="flex w-full flex-col gap-1">
			<Label for="name">Result</Label>
			<Input id="name" value={buildQuery} readonly clearButton={false} />
		</div>
		<div class="flex flex-col justify-end">
			<Button
				variant="outline"
				onclick={(e) =>
					onSearch(
						buildQuery,
						searchMode === 'Complex' ? 'complex' : 'redis',
						`${sortBy}:${sortByDirection}`,
						e.ctrlKey || e.metaKey
					)}
			>
				<Search />
				Search
			</Button>
		</div>
	</div>
</div>
