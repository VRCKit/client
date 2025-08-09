<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index';
	import { BookUser, CheckCheck, UserPen, Workflow } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { api } from '$lib/base/api';
	import { onMount } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import X from '@lucide/svelte/icons/x';
	import { goto } from '$app/navigation';

	let currentUser = $state<CurrentUser | null>(null);

	let cfg = $state({
		display_name: ''
	});

	onMount(() => {
		api.vrckit.users.current.fetch().then((user) => {
			currentUser = user;
			cfg.display_name = user.display_name;
		});
	});
</script>

<svelte:head>
	<title>Profile</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center p-2">
	<Accordion.Root type="single" class="w-[70%]" value="general">
		<Accordion.Item value="general">
			<Accordion.Trigger>
				<div class="flex items-center justify-start gap-2">
					<UserPen size={24} />
					General
				</div>
			</Accordion.Trigger>
			<Accordion.Content class="w-[70%]">
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="display-name">Display Name</Label>
					<Label for="display-name" class="text-sm font-normal text-gray-500">
						This is the name that will be displayed in the app. Where possible, it will be used to
						identify you.
					</Label>
					<div class="flex w-full gap-2">
						<Input
							id="display-name"
							class="w-[250px]"
							clearButton={false}
							bind:value={cfg.display_name}
						/>
						<Button
							variant="outline"
							class="w-fit"
							disabled={cfg.display_name === currentUser?.display_name}
							onclick={async () => {
								const res = await api.vrckit.users.current.patch({
									display_name: cfg.display_name
								});
								if (!res.error) {
									api.toast.success('Display name updated successfully!');
									api.events.emit('VRCKitCurrentUserUpdated');
									currentUser = await api.vrckit.users.current.fetch();
								} else {
									api.toast.error('Failed to update display name.', {
										description: res.error
									});
								}
							}}
						>
							Update
						</Button>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="connections">
			<Accordion.Trigger>
				<div class="flex items-center justify-start gap-2">
					<Workflow size={24} />
					Connections
				</div>
			</Accordion.Trigger>
			<Accordion.Content class="w-[70%]">
				<div class="mb-4 flex flex-col gap-2 p-1">
					<div class="flex flex-col gap-2">
						<div class="flex items-center gap-2">
							<svg viewBox="0 0 1080 1080" style="fill: currentColor; width: 24px; height: 24px;">
								<path
									class="st0"
									d="M1033.05,324.45c-0.19-137.9-107.59-250.92-233.6-291.7c-156.48-50.64-362.86-43.3-512.28,27.2
	C106.07,145.41,49.18,332.61,47.06,519.31c-1.74,153.5,13.58,557.79,241.62,560.67c169.44,2.15,194.67-216.18,273.07-321.33
	c55.78-74.81,127.6-95.94,216.01-117.82C929.71,603.22,1033.27,483.3,1033.05,324.45z"
								/>
							</svg>
							<div class="flex w-full flex-col gap-1">
								<Label>Patreon Account</Label>
								<Label class="text-sm font-normal text-gray-500">
									Connect your Patreon account to get access to premium features.
								</Label>
							</div>
						</div>
						<div class="flex w-full flex-col gap-2">
							{#if currentUser?.patreon_email}
								<div class="flex items-center gap-2">
									<CheckCheck size={24} />
									<div class="flex flex-col">
										<span class="text-sm font-bold text-gray-200"
											>Connected as {currentUser.patreon_email}</span
										>
										<span class="text-sm text-gray-400">
											Your patreon account ID is {currentUser.patreon_user_id}.
										</span>
									</div>
								</div>
							{:else}
								<div class="item-center flex items-center gap-2">
									<X />
									<span class="text-sm font-bold text-gray-200">Not connected</span>
								</div>
							{/if}
							<Button
								variant="outline"
								class="w-fit"
								onclick={async () => {
									const url = await api.vrckit.connections.patreon.fetchUrl();
									api.shell.openExternal(url);
								}}>{currentUser?.patreon_email ? 'Re-connect' : 'Connect'}</Button
							>
						</div>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="accounts">
			<Accordion.Trigger>
				<div class="flex items-center justify-start gap-2">
					<BookUser size={24} />
					Accounts
				</div>
			</Accordion.Trigger>
			<Accordion.Content class="w-[70%]">
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="vrckit-logout">VRCKit Logout</Label>
					<Label for="vrckit-logout" class="text-sm font-normal text-gray-500">
						Logging out will remove your VRCKit account from this device. You will need to log in
						again to use VRCKit.
					</Label>
					<div class="flex w-full gap-2">
						<Dialog.Root>
							<Dialog.Trigger>
								<Button variant="destructive">Logout</Button>
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
									<Dialog.Description>This action cannot be undone.</Dialog.Description>
								</Dialog.Header>

								<Button
									variant="destructive"
									onclick={async () => {
										await api.vrckit.auth.logout();
										window.location.href = "/";
									}}>Logout</Button
								>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="vrchat-logout">VRChat Logout</Label>
					<Label for="vrchat-logout" class="text-sm font-normal text-gray-500">
						Logging out will remove your VRChat account from this device. You will need to log in
						again to use VRCKit.
					</Label>
					<div class="flex w-full gap-2">
						<Dialog.Root>
							<Dialog.Trigger>
								<Button variant="destructive">Logout</Button>
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
									<Dialog.Description>This action cannot be undone.</Dialog.Description>
								</Dialog.Header>

								<Button
									variant="destructive"
									onclick={async () => {
										await api.vrchat.auth.logout();
										window.location.href = "/";
									}}>Logout</Button
								>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="vrchat-logout">Switch VRChat Accounts</Label>
					<Label for="vrchat-logout" class="text-sm font-normal text-gray-500">
						You can switch between your VRChat accounts here. This will not log you out, but will
						change the account you are using in the app.
					</Label>
					<div class="flex w-full gap-2">
						<Button
							variant="outline"
							onclick={async () => {
								goto('/authorization/vrchat-switcher', {
									replaceState: true
								});
							}}>Switch Accounts</Button
						>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>
