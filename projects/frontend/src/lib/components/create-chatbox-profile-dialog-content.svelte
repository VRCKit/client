<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Select from '$lib/components/ui/select/index';
	import { api } from '$lib/base/api';
	import { onMount } from 'svelte';
	import { Textarea } from '$lib/components/ui/textarea/index';

	const cfg = $state({
		name: '',
		visibility: 'Public' as 'Public' | 'Private'
	});

	let preview = $state('');

	const {
		onClose
	}: {
		onClose: () => void;
	} = $props();

	async function create() {
		if (cfg.name.trim().length < 3) {
			api.toast.error('Name is too short, must be at least 3 characters long');
			return;
		}

		try {
			const config = api.chatbox.getConfig();
			await api.vrckit.chatboxProfiles.put({
				name: cfg.name,
				visibility: cfg.visibility,
				config: {
					egg: config.egg,
					modules: api.chatbox.modules.getAllInputValues(false),
					template: config.template,
					trim_template: config.trimTemplate,
					auto_template_update_condition: config.autoTemplateUpdateCondition
				},
				preview
			});
			api.toast.success('Profile created successfully');
			onClose();
		} catch (error) {
			api.toast.error('Failed to create profile', {
				description: (error as Error).message,
				duration: 5000
			});
			return;
		}
	}

	async function refreshPreview() {
		preview = await api.chatbox.getTemplateContent();
	}

	onMount(() => {
		refreshPreview();
	});
</script>

<Dialog.Header>
	<Dialog.Title>Create Chatbox Profile</Dialog.Title>
	<Dialog.Description>Please specify properties you want on the chatbox profile.</Dialog.Description
	>
</Dialog.Header>
<div class="space-y-2">
	<div class="space-y-1">
		<Label for="name">Name</Label>
		<Input id="name" bind:value={cfg.name} maxlength={128} />
	</div>
	<div class="space-y-1">
		<Label for="name">Preview</Label>
		<Textarea readonly class="h-[196px] resize-none text-center" value={preview}></Textarea>
		<Button onclick={refreshPreview} variant="outline" class="w-[462px]">Refresh Preview</Button>
	</div>
	<div class="flex items-end justify-between gap-1">
		<div class="space-y-1">
			<Label>Visibility</Label>
			<Select.Root type="single" bind:value={cfg.visibility}>
				<Select.Trigger class="w-[180px]">{cfg.visibility}</Select.Trigger>
				<Select.Content>
					<Select.Item value="Public">Public</Select.Item>
					<Select.Item value="Private">Private</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<Button onclick={create}>Create</Button>
			</div>
		</div>
	</div>
</div>
