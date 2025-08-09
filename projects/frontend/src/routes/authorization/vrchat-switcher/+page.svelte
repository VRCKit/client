<script lang="ts">
	import { api } from '$lib/base/api';
	import type { VRChatAccount } from '$lib/base/api/list/Config/VRChatAccounts';
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card/index';
	import { Button } from '$lib/components/ui/button/index';
	import { Trash2 } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import * as Dialog from '$lib/components/ui/dialog/index';

	let accounts = $state<VRChatAccount[]>([]);

	async function updateAccounts() {
		accounts = await api.config.vrchatAccounts.getRawAccounts();
	}

	onMount(async () => {
		updateAccounts();
	});
</script>

<svelte:head>
	<title>VRChat Accounts</title>
</svelte:head>

<div class="flex h-[var(--full-height)] w-full items-center justify-center">
	<Card.Root>
		<Card.Header>
			<Card.Title>VRChat Accounts</Card.Title>
			<Card.Description>
				Your VRChat accounts are listed here. You can select one to use it in the app.
			</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2">
			{#each accounts as acc}
				<Card.Root class={acc.selected ? 'border-2 border-gray-500' : ''}>
					<Card.Content class="flex flex-col gap-2 p-2">
						<div class="flex items-start justify-between gap-2">
							<div class="flex items-center gap-1">
								<div class="text-xl font-semibold text-gray-200">
									{acc.display_name}
								</div>
								<div class="font-code text-sm text-gray-500">
									{acc.username}
								</div>
							</div>
							<div class="flex w-fit text-xs text-gray-400">
								{acc.last_login_at ? new Date(acc.last_login_at).toLocaleString() : 'Never'}
							</div>
						</div>
						<div class="flex items-center justify-between gap-2">
							<Tooltip.Provider delayDuration={0}>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button
											variant="outline"
											onclick={async () => {
												await api.config.vrchatAccounts.setSelectedAccount(acc.username);
												await updateAccounts();
												api.toast.success('Account selected.', {
													description: `Account ${acc.display_name} selected successfully.`
												});
												window.location.href = '/';
											}}
											disabled={acc.selected}
										>
											{acc.selected ? 'Selected' : 'Select'}
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content>
										{acc.selected
											? 'This account is currently selected and will be used in the app.'
											: 'Select this account to use it in the app.'}
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
							<Dialog.Root>
								<Dialog.Trigger>
									<Tooltip.Provider delayDuration={0}>
										<Tooltip.Root>
											<Tooltip.Trigger>
												<Button size="icon" variant="outline">
													<Trash2 />
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content>Remove this account from the list.</Tooltip.Content>
										</Tooltip.Root>
									</Tooltip.Provider>
								</Dialog.Trigger>
								<Dialog.Content>
									<Dialog.Header>
										<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
										<Dialog.Description>This action cannot be undone.</Dialog.Description>
									</Dialog.Header>

									<Button
										variant="destructive"
										onclick={async () => {
											await api.config.vrchatAccounts.removeAccount(acc.username);
											updateAccounts();
											api.toast.success('Removed account', {
												description: `Account ${acc.display_name} removed successfully.`
											});
										}}>Remove Account</Button
									>
								</Dialog.Content>
							</Dialog.Root>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
			<div class="flex w-full items-center justify-end">
				<a href="/authorization?force=true" class="text-xs hover:underline"> Add New Account </a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
