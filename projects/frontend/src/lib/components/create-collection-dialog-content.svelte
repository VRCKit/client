<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index';
	import * as Select from '$lib/components/ui/select/index';
	import { api } from '$lib/base/api';
	import { goto } from '$app/navigation';

	const state = $state({
		name: '',
		description: '',
		tags: '',
		visibility: 'Public' as 'Public' | 'Private'
	});

	const {
		onClose
	}: {
		onClose: () => void;
	} = $props();

	async function create() {
		if (state.name.trim().length < 3) {
			api.toast.error('Name is too short, must be at least 3 characters long');
			return;
		}

		try {
			const collection = await api.vrckit.avatarCollections.put({
				name: state.name,
				description: state.description,
				tags: state.tags
					.split(',')
					.map((tag) => tag.trim().toLowerCase())
					.join(', '),
				visibility: state.visibility
			});
			api.toast.success('Collection created successfully');
			onClose();
			goto(`/avatars/collections/item?id=${collection.id}`, { replaceState: true });
		} catch (error) {
			api.toast.error('Failed to create collection', {
				description: (error as Error).message,
				duration: 5000
			});
			return;
		}
	}
</script>

<Dialog.Header>
	<Dialog.Title>Create Collection</Dialog.Title>
	<Dialog.Description>Please specify properties you want on the collection.</Dialog.Description>
</Dialog.Header>
<div class="space-y-2">
	<div class="space-y-1">
		<Label for="name">Name</Label>
		<Input id="name" bind:value={state.name} maxlength={128} />
	</div>
	<div class="space-y-1">
		<Label for="description">Description</Label>
		<Textarea
			id="description"
			placeholder="Epicest collection ever"
			bind:value={state.description}
			maxlength={512}
		/>
	</div>
	<div class="space-y-1">
		<Label for="tags">Tags</Label>
		<Textarea id="tags" placeholder="cool, epic, awesome" bind:value={state.tags} maxlength={512} />
	</div>
	<div class="flex items-end justify-between gap-1">
		<div class="space-y-1">
			<Label>Visibility</Label>
			<Select.Root type="single" bind:value={state.visibility}>
				<Select.Trigger class="w-[180px]">{state.visibility}</Select.Trigger>
				<Select.Content>
					<Select.Item value="Public">Public</Select.Item>
					<Select.Item value="Private">Private</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
		<div class="space-y-1">
			<Button onclick={create}>Create</Button>
		</div>
	</div>
</div>
