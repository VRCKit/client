<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { api } from '$lib/base/api';
	import { Textarea } from '$lib/components/ui/textarea/index';

	const cfg = $state({
		title: '',
		reason: ''
	});

	const {
		onClose,
		avatarId
	}: {
		onClose: () => void;
		avatarId: string;
	} = $props();

	async function report() {
		if (cfg.title.trim().length < 3) {
			api.toast.error('Title is too short, must be at least 3 characters long');
			return;
		}

		const success = await api.vrckit.avatars.report(avatarId, cfg.title, cfg.reason);

		if (success) {
			api.toast.success('Avatar reported successfully');
			onClose();
		} else {
			api.toast.error('Failed to report avatar.');
		}
	}
</script>

<Dialog.Header>
	<Dialog.Title>Report Avatar</Dialog.Title>
	<Dialog.Description>
		Report an avatar to the moderators. Please provide a title and reason for the report.
	</Dialog.Description>
</Dialog.Header>
<div class="space-y-2">
	<div class="space-y-1">
		<Label for="name">Title</Label>
		<Input id="name" bind:value={cfg.title} maxlength={128} />
	</div>
	<div class="space-y-1">
		<Label for="reason">Reason</Label>
		<Textarea id="reason" bind:value={cfg.reason} rows={3} />
	</div>
	<div class="flex items-end justify-end gap-1">
		<div class="flex gap-2">
			<Button onclick={report}>Report</Button>
		</div>
	</div>
</div>
