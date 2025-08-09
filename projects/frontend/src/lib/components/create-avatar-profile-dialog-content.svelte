<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Select from '$lib/components/ui/select/index';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import { api } from '$lib/base/api';
	import { RefreshCcw } from 'lucide-svelte';

	const cfg = $state({
		name: '',
		visibility: 'Public' as 'Public' | 'Private'
	});

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
			await api.vrckit.avatarProfiles.put({
				name: cfg.name,
				visibility: cfg.visibility,
				avatar_id: api.osc.avatar.currentAvatarId!,
				parameters: api.osc.avatar.currentParameters
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
</script>

<Dialog.Header>
	<Dialog.Title>Create Avatar Profile</Dialog.Title>
	<Dialog.Description>Please specify properties you want on the avatar profile.</Dialog.Description>
</Dialog.Header>
<div class="space-y-2">
	<div class="space-y-1">
		<Label for="name">Name</Label>
		<Input id="name" bind:value={cfg.name} maxlength={128} />
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
				<Tooltip.Provider delayDuration={0} disableHoverableContent>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								onclick={async () => {
									api.toast.info('Refreshing avatar parameters..');
									const success = await api.osc.avatar.refreshBaseParameters();
									if (success) {
										api.toast.success('Avatar parameters refreshed');
									} else {
										api.toast.error('Failed to refresh avatar parameters');
									}
								}}
								variant="outline"
								size="icon"
							>
								<RefreshCcw />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content class="max-w-64 text-center">
							Refresh avatar parameters from the filesystem. For example it's useful when you just
							reset the avatar etc.
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<Button onclick={create}>Create</Button>
			</div>
		</div>
	</div>
</div>
