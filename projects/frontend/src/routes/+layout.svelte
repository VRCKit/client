<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { api } from '$lib/base/api';
	import { X, Minus, ArrowRight, ArrowLeft } from 'lucide-svelte';
	import { Toaster } from '$lib/components/ui/sonner/index';
	import { Button } from '$lib/components/ui/button/index';
	import * as Sidebar from '$lib/components/ui/sidebar/index';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import * as Avatar from '$lib/components/ui/avatar/index';
	import 'svelte-highlight/styles/atom-one-dark.css';
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import { afterNavigate, goto } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { c } from 'svelte-highlight/languages';

	const MaxHistorySize = 16;
	let navigatingWithHistoryButtons = false;

	let currentUser: CurrentUser | null = $state(null);
	let selectedAvatarId = $state('');

	let documentTitle = $state('');

	let appVersion = api.ipcRenderer.sendSync('GetAppVersion');
	let webVersion = api.constants.WebVersion;

	let urlHistory = $state({
		back: [] as string[],
		forward: [] as string[]
	});

	let { children } = $props();

	onMount(() => {
		(async () => {
			if (!(await api.vrchat.auth.isLoggedIn()) || !(await api.vrckit.auth.isLoggedIn())) {
				goto('/authorization');
			}
		})();

		api.init();
		// @ts-expect-error
		window.VRCKitAPI = api;
		documentTitle = document.title;

		function fetchCurrentUser() {
			api.vrckit.users.current
				.fetch()
				.then((user) => {
					currentUser = user;
					selectedAvatarId = user.selected_avatar_id ?? '';
				})
				.catch(() => {
					currentUser = null;
				});
		}

		function onAvatarSelected({ id }: { id: string }) {
			selectedAvatarId = id;
		}

		fetchCurrentUser();
		api.events.on('VRCKitAuthSuccess', fetchCurrentUser);
		api.events.on('VRCKitCurrentUserUpdated', fetchCurrentUser);
		api.events.on('AvatarSelected', onAvatarSelected);

		return () => {
			api.events.off('VRCKitAuthSuccess', fetchCurrentUser);
			api.events.off('VRCKitCurrentUserUpdated', fetchCurrentUser);
			api.events.off('AvatarSelected', onAvatarSelected);
			api.destroy();
		};
	});

	function getUrl(url?: URL) {
		if (!url) return '/';
		return url.pathname + url.search + url.hash;
	}

	afterNavigate(({ from, to }) => {
		if (navigatingWithHistoryButtons) {
			// History is managed by goBack/goForward, so skip auto-update
			return;
		}

		if (from && to && getUrl(from?.url) !== getUrl(to?.url)) {
			// This is a new navigation (not from our buttons or already handled)
			urlHistory.back.push(getUrl(from.url));
			if (urlHistory.back.length > MaxHistorySize) {
				urlHistory.back.shift(); // Remove the oldest entry
			}
			urlHistory.forward = []; // Clear forward history on new navigation
		}
	});

	function goBack() {
		if (urlHistory.back.length > 0) {
			const prevUrl = urlHistory.back.pop();
			if (prevUrl) {
				urlHistory.forward.push(getUrl(page.url));
				if (urlHistory.forward.length > MaxHistorySize) {
					urlHistory.forward.shift(); // Remove the oldest entry
				}
				navigatingWithHistoryButtons = true;
				goto(prevUrl, { replaceState: true }).finally(() => {
					navigatingWithHistoryButtons = false;
				});
			}
		}
	}

	function goForward() {
		if (urlHistory.forward.length > 0) {
			const nextUrl = urlHistory.forward.pop();
			if (nextUrl) {
				urlHistory.back.push(getUrl(page.url));
				if (urlHistory.back.length > MaxHistorySize) {
					urlHistory.back.shift(); // Remove the oldest entry
				}
				navigatingWithHistoryButtons = true;
				goto(nextUrl, { replaceState: true }).finally(() => {
					navigatingWithHistoryButtons = false;
				});
			}
		}
	}

	$effect(() => {
		page.url;
		documentTitle = document.title;
	});

	let legalsModalOpen = $state(false);

	onMount(async () => {
		const lastSeenLegalDate = await api.config.get('LastSeenLegalDate');
		if (lastSeenLegalDate !== api.constants.LatestLegalDate) {
			legalsModalOpen = true;
		}
	});
</script>

<svelte:document
	onkeydown={(e) => {
		if (e.key === 'F1') {
			api.shell.openExternal('https://discord.gg/dPSZuVSnpc');
		}
	}}
/>

<Toaster richColors theme="dark" />
<div class="relative flex h-full w-full flex-col">
	<div
		class="absolute left-[12rem] flex h-[60px] min-h-[60px] w-[var(--full-width)] items-center justify-between border-b px-4"
		style="-webkit-app-region: drag;"
	>
		<div class="flex items-center gap-4">
			<div class="font-heading text-2xl font-semibold tracking-tight">VRCKit</div>
			<div class="flex items-center gap-1" style="-webkit-app-region: no-drag;">
				<ArrowLeft
					size={18}
					class="cursor-pointer text-gray-400 transition-colors hover:text-gray-200 {urlHistory.back
						.length === 0
						? 'pointer-events-none opacity-50'
						: ''}"
					onclick={() => {
						if (urlHistory.back.length > 0) goBack();
					}}
				/>
				<ArrowRight
					size={18}
					class="cursor-pointer text-gray-400 transition-colors hover:text-gray-200 {urlHistory
						.forward.length === 0
						? 'pointer-events-none opacity-50'
						: ''}"
					onclick={() => {
						if (urlHistory.forward.length > 0) goForward();
					}}
				/>
			</div>
		</div>
		<div
			class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-lg font-light"
		>
			{documentTitle}
		</div>
		<div class="flex items-center gap-2" style="-webkit-app-region: no-drag;">
			{#if currentUser}
				<Tooltip.Provider delayDuration={0}>
					<Tooltip.Root>
						<Tooltip.Trigger class="cursor-pointer">
							<a href="/authorization/vrchat-switcher">
								<Avatar.Root>
									<Avatar.Image
										src={api.utils.avatarImageURL(selectedAvatarId)}
										alt={currentUser.display_name}
										style="object-fit: cover;"
									/>
									<Avatar.Fallback
										>{currentUser.display_name.slice(0, 2).toUpperCase()}</Avatar.Fallback
									>
								</Avatar.Root>
							</a>
						</Tooltip.Trigger>
						<Tooltip.Content>{currentUser.display_name}</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{:else}
				<Avatar.Root>
					<Avatar.Fallback>VR</Avatar.Fallback>
				</Avatar.Root>
			{/if}
			<Button
				variant="ghost"
				size="icon"
				onclick={() => {
					api.ipcRenderer.send('Hide');
					new Notification('VRCKit', {
						body: 'Moved into the tray.'
					});
				}}
			>
				<Minus />
			</Button>
			<Button variant="ghost" size="icon" onclick={() => api.ipcRenderer.send('Quit')}>
				<X />
			</Button>
		</div>
	</div>
	<Sidebar.Provider open={true}>
		<AppSidebar />
	</Sidebar.Provider>
	<div
		class="absolute left-[12rem] top-[60px] flex h-[var(--full-height)] w-[var(--full-width)] flex-1"
	>
		{@render children()}
	</div>
	<div class="absolute bottom-2 right-2 select-none text-xs opacity-50" style="z-index: 9999999;">
		v{appVersion} / v{webVersion}
	</div>
</div>

<Dialog.Root
	open={legalsModalOpen}
	onOpenChange={async (open) => {
		legalsModalOpen = open;
		if (!open) {
			const lastSeenLegalDate = await api.config.get('LastSeenLegalDate');
			if (lastSeenLegalDate !== api.constants.LatestLegalDate) {
				legalsModalOpen = true;
			}
		}
	}}
>
	<Dialog.Content escapeKeydownBehavior="ignore" interactOutsideBehavior="ignore">
		<Dialog.Header>
			<Dialog.Title>Legal document has been updated!</Dialog.Title>
			<Dialog.Description>
				<div class="flex flex-col gap-2">
					<p>
						Please review the latest changes to our legal documents to continue using VRCKit. You
						can find the updated documents in the <button
							class="cursor-pointer text-purple-500 hover:underline"
							onclick={() => {
								api.shell.openExternal('https://vrckit.com/legal');
							}}
						>
							legal documents
						</button> section.
					</p>
					<p class="text-xs">
						By clicking "Accept", you acknowledge that you have read and agree to the updated terms.
					</p>
					<Button
						variant="default"
						onclick={async () => {
							await api.config.set('LastSeenLegalDate', api.constants.LatestLegalDate);
							window.location.href = '/';
						}}
					>
						Accept
					</Button>
				</div>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>

<style>
	:global(body) {
		--full-height: calc(100vh - 60px);
		--full-width: calc(100vw - 12rem);
	}
</style>
