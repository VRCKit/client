<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Textarea } from '$lib/components/ui/textarea/index';
	import * as Select from '$lib/components/ui/select/index';
	import { api } from '$lib/base/api';
	import { goto } from '$app/navigation';
	import type { AvatarCollection } from '$lib/base/api/list/VRCKit/AvatarCollections';

	const {
		onClose,
		collection
	}: {
		onClose: (deleted: boolean) => void;
		collection: AvatarCollection;
	} = $props();

	const state = $state({
		name: collection.name,
		description: collection.description,
		tags: collection.tags,
		visibility: collection.visibility
	});

	async function edit() {
		if (!state.name.trim()) {
			api.toast.error('Name field is required');
			return;
		}

		try {
			const success = await api.vrckit.avatarCollections.patch(collection.id, {
				name: state.name,
				description: state.description,
				tags: state.tags
					.split(',')
					.map((tag) => tag.trim().toLowerCase())
					.join(', '),
				visibility: state.visibility
			});
			if (!success) {
				api.toast.error('Failed to edit collection');
				return;
			}
			api.toast.success('Collection edited successfully');
			onClose(false);
		} catch (error) {
			api.toast.error('Failed to edit collection', {
				description: (error as Error).message,
				duration: 5000
			});
			return;
		}
	}

	async function deleteCollection() {
		try {
			const success = await api.vrckit.avatarCollections.delete(collection.id);
			if (!success) {
				api.toast.error('Failed to delete collection');
				return;
			}
			api.toast.success('Collection deleted successfully');
			onClose(true);
			goto('/avatars/collections', { replaceState: true });
		} catch (error) {
			api.toast.error('Failed to delete collection', {
				description: (error as Error).message,
				duration: 5000
			});
			return;
		}
	}
</script>

<Dialog.Header>
	<Dialog.Title>Edit Collection</Dialog.Title>
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
		<div class="flex gap-2">
			<Dialog.Root>
				<Dialog.Trigger>
					<Button variant="destructive">Delete</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
						<Dialog.Description>This action cannot be undone.</Dialog.Description>
					</Dialog.Header>

					<Button variant="destructive" onclick={deleteCollection}>Delete</Button>
				</Dialog.Content>
			</Dialog.Root>
			<Button onclick={edit}>Edit</Button>
		</div>
	</div>
</div>
