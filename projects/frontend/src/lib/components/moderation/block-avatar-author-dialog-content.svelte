<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { api } from '$lib/base/api';
	import { Textarea } from '$lib/components/ui/textarea/index';

	const cfg = $state({
		id: '',
		reason: ''
	});

	const {
		onClose
	}: {
		onClose: () => void;
	} = $props();

	async function block() {
		if (!cfg.id.match(api.constants.UserIdRegex)?.[0] || cfg.reason.trim().length === 0) {
			api.toast.error('Invalid avatar author id or reason');
			return;
		}

		const result = await api.vrckit.moderation.avatars.blockedAuthors.put(cfg.id, cfg.reason);

		if (result.success) {
			api.toast.success('Avatar Author blocked');
			onClose();
		} else {
			api.toast.error('Failed to block Avatar Author');
		}
	}
</script>

<Dialog.Header>
	<Dialog.Title>Block Avatar Author</Dialog.Title>
	<Dialog.Description>Please enter the avatar author id you want to block.</Dialog.Description>
</Dialog.Header>
<div class="space-y-2">
	<div class="space-y-1">
		<Label for="name">Avatar Author Id</Label>
		<Input id="name" bind:value={cfg.id} maxlength={128} />
	</div>
	<div class="space-y-1">
		<Label for="reason">Reason</Label>
		<Textarea id="reason" bind:value={cfg.reason} rows={3} placeholder="Required" />
	</div>
	<div class="flex items-end justify-end gap-1">
		<div class="flex gap-2">
			<Button onclick={block}>Block</Button>
		</div>
	</div>
</div>
