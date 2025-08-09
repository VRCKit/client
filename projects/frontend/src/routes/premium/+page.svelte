<script lang="ts">
	import { Button } from '$lib/components/ui/button/index';
	import * as Card from '$lib/components/ui/card/index';
	import { CheckCheck, CircleDollarSign, Pointer } from 'lucide-svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import type { CurrentUser } from '$lib/base/api/list/VRCKit/Users/Current';
	import { api } from '$lib/base/api';
	import { onMount } from 'svelte';

	let currentUser = $state<CurrentUser | null>(null);

	onMount(() => {
		api.vrckit.users.current.fetch().then((user) => {
			currentUser = user;
		});
	});
</script>

<svelte:head>
	<title>VRCKit Premium</title>
</svelte:head>

<ScrollArea class="h-[var(--full-height)] w-full">
	<div class="flex h-96 w-full flex-col items-center gap-12 py-2">
		<div class="flex w-[90%] flex-col items-center justify-center gap-8">
			<div class="flex w-full flex-col items-center justify-center gap-4">
				<h3 class="text-4xl font-semibold leading-none tracking-tight text-gray-200">Premium</h3>
				<p class="text-md w-[90%] text-center text-gray-400 md:w-[50%]">
					<span class="text-gray-200">VRCKit</span> is
					<span class="text-gray-200">free to use</span>! We do not charge anything for using our
					service. We only ask for your <span class="text-gray-200">support</span> to
					<span class="text-gray-200">keep service running</span>. By purchasing a
					<span class="text-gray-200">fixed-price</span>
					subscription, called <span class="text-gray-200">VRCKit Premium</span>, you can
					<span class="text-gray-200">support</span>
					us and get some <span class="text-gray-200">extra features</span> in return.
				</p>
			</div>
			<div class="mb-8 flex justify-center gap-8">
				<Card.Root
					class="relative h-[550px] w-[300px] border-gray-500 shadow-lg transition-all hover:border-gray-200"
				>
					<Card.Header class="flex flex-col items-center">
						<Card.Title class="text-center">Free Tier</Card.Title>
						<Card.Description class="text-center"
							>Free to use, <span class="text-gray-200">no cost</span>.</Card.Description
						>
					</Card.Header>
					<Card.Content class="flex flex-col justify-center gap-4">
						<div class="flex list-disc flex-col gap-2 pl-4 text-sm">
							<p class="text-muted-foreground list-item">
								Only able to see <span class="text-gray-200">first 250</span> avatar results.
							</p>
							<p class="text-muted-foreground list-item">
								Favorite up to <span class="text-gray-200">50</span> avatars.
							</p>
							<p class="text-muted-foreground list-item">
								Create up to <span class="text-gray-200">2</span> avatar collections.
							</p>
							<p class="text-muted-foreground list-item">
								Collections can have up to <span class="text-gray-200">50</span> items.
							</p>
							<p class="text-muted-foreground list-item">
								Create up to <span class="text-gray-200">5</span> profiles per avatar.
							</p>
						</div>
					</Card.Content>
					<Card.Footer class="absolute bottom-2 w-full">
						<Button class="w-full" variant="secondary" size="lg" disabled>
							<CheckCheck size={24} />
							{currentUser?.system_flags?.includes('PremiumTier3')
								? 'Currently Premium Tier'
								: 'Currently Free Tier'}
						</Button>
					</Card.Footer>
				</Card.Root>
				<Card.Root
					class="relative h-[550px] w-[300px] border-indigo-500 drop-shadow-[0_14px_35px_#6366f1] transition-all hover:border-indigo-200"
				>
					<Card.Header class="flex flex-col items-center">
						<Card.Title class="text-center">Premium Tier</Card.Title>
						<Card.Description class="text-center">
							<span class="text-gray-200">$10/month</span>, supports development and hosting costs.
						</Card.Description>
					</Card.Header>
					<Card.Content class="flex flex-col justify-center gap-4">
						<div class="flex list-disc flex-col gap-2 pl-4 text-sm">
							<p class="text-muted-foreground list-item">
								Able to see <span class="text-gray-200">more than first 250</span> avatar results.
							</p>
							<p class="text-muted-foreground list-item">
								Favorite up to <span class="text-gray-200">10,000</span> avatars.
							</p>
							<p class="text-muted-foreground list-item">
								Create up to <span class="text-gray-200">100</span> avatar collections.
							</p>
							<p class="text-muted-foreground list-item">
								Collections can have up to <span class="text-gray-200">500</span> items.
							</p>
							<p class="text-muted-foreground list-item">
								Create <span class="text-gray-200">private</span> collections.
							</p>
							<p class="text-muted-foreground list-item">
								Create up to <span class="text-gray-200">100</span> profiles per avatar.
							</p>
							<p class="text-muted-foreground list-item">
								Create <span class="text-gray-200">private</span> profiles.
							</p>
							<p class="text-muted-foreground list-item">
								Chatbox <span class="text-gray-200">Pulsoid</span> module.
							</p>
							<p class="text-muted-foreground list-item">
								Chatbox <span class="text-gray-200">HTTP</span> module.
							</p>
							<p class="text-muted-foreground list-item">
								Chatbox <span class="text-gray-200">Speech To Text</span> module.
							</p>
							<p class="text-muted-foreground list-item">
								<span class="text-gray-200">Premium</span> role on Discord server.
							</p>
						</div>
					</Card.Content>
					<Card.Footer class="absolute bottom-2 w-full">
						<Button
							variant="secondary"
							size="lg"
							onclick={async () => {
								if (!currentUser?.patreon_email) {
									const url = await api.vrckit.connections.patreon.fetchUrl();
									api.shell.openExternal(url);
								} else {
									api.shell.openExternal('https://www.patreon.com/c/armagan/membership');
								}
							}}
							disabled={currentUser?.system_flags?.includes('PremiumTier3')}
							class="w-full {currentUser?.system_flags?.includes('PremiumTier3')
								? 'border border-yellow-500'
								: ''}"
						>
							<CircleDollarSign size={24} />
							{currentUser?.patreon_email
								? currentUser?.system_flags?.includes('PremiumTier3')
									? 'Already Subscribed'
									: 'Get Premium'
								: 'Connect Patreon'}
						</Button>
					</Card.Footer>
				</Card.Root>
			</div>
		</div>
	</div>
</ScrollArea>
