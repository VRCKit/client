<script lang="ts">
	import { api } from '$lib/base/api';
	import type { Avatar } from '$lib/base/api/list/VRCKit/Avatars';
	import VerticalAvatarCard from '$lib/components/vertical-avatar-card.svelte';
	import { onMount } from 'svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { goto } from '$app/navigation';

	let randomAvatars: Avatar[] = $state([]);

	async function fetchAvatars() {
		let avatars = await api.vrckit.avatars.search('@random', 0, 5);
		randomAvatars = avatars.avatars;
	}

	onMount(() => {
		fetchAvatars();

		let interval = setInterval(fetchAvatars, 5000);
		return () => {
			clearInterval(interval);
		};
	});
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<ScrollArea class="w-full">
	<div class="flex h-full w-full flex-col items-center justify-center gap-12 py-24">
		<div class="flex w-[75%] flex-col items-center justify-center gap-8">
			<h1
				class="bg-animation bg-gradient-to-r from-purple-50 via-indigo-500 to-purple-50 bg-clip-text text-8xl font-bold leading-none tracking-tight text-transparent drop-shadow-[0_35px_35px_#6366f1]"
			>
				VRCKit
			</h1>
			<p class="w-[50%] text-center text-lg text-gray-400">
				VRCKit will change how you explore new avatars in VRChat. With VRCKit, you can easily find
				new avatars extremely fast. Save your avatars in any way! And it's not just the avatars!
			</p>
		</div>
		<div class="flex flex-col items-center justify-center gap-8">
			<div class="flex w-[75%] flex-col items-center justify-center gap-2">
				<h3 class="text-4xl font-semibold leading-none tracking-tight text-gray-200">
					Random Avatars
				</h3>
				<p class="w-[50%] text-center text-lg text-gray-400">
					Explore more avatars in <a href="/avatars/library" class="text-gray-200 hover:underline"
						>Avatar Library</a
					> page!
				</p>
			</div>
			<div class="flex gap-4">
				{#each randomAvatars as avatar}
					<div class="transition duration-500 hover:scale-110">
						<VerticalAvatarCard
							{avatar}
							search={(query, engine) => {
								goto(`/avatars/library?query=${encodeURIComponent(query)}&query_engine=${engine}`, {
									replaceState: true
								});
							}}
							showOpenInLibrary
						/>
					</div>
				{/each}
			</div>
		</div>
	</div>
</ScrollArea>
