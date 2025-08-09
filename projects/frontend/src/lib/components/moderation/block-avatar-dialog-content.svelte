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
		if (!cfg.id.match(api.constants.AvatarIdRegex)?.[0]) {
			api.toast.error('Invalid avatar id');
			return;
		}

		const avatar = await api.vrchat.avatars.fetch(cfg.id);
		if (!avatar) {
			api.toast.error('Avatar not found');
			return;
		}

		const result = await api.vrckit.moderation.avatars.blocked.put(
			avatar.id,
			avatar.name,
			avatar.author_id,
			avatar.author_name,
			cfg.reason
		);

		if (result.success) {
			api.toast.success('Avatar blocked');
			onClose();
		} else {
			api.toast.error('Failed to block avatar');
		}
	}
</script>

<Dialog.Header>
	<Dialog.Title>Block Avatar</Dialog.Title>
	<Dialog.Description>Please enter the avatar id you want to block.</Dialog.Description>
</Dialog.Header>
<div class="space-y-2">
	<div class="space-y-1">
		<Label for="name">Avatar Id</Label>
		<Input id="name" bind:value={cfg.id} maxlength={128} />
	</div>
	<div class="space-y-1">
		<Label for="reason">Reason</Label>
		<Textarea id="reason" bind:value={cfg.reason} rows={3} placeholder="Optional" />
	</div>
	<div class="flex items-end justify-end gap-1">
		<div class="flex gap-2">
			<Button onclick={block}>Block</Button>
		</div>
	</div>
</div>
