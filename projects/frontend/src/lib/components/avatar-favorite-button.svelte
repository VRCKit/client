<script lang="ts">
	import { api } from '$lib/base/api';
	import { onMount } from 'svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import { Star, StarOff } from 'lucide-svelte';

	const {
		avatarId,
		onFavoriteToggle,
		class: className = ''
	}: {
		avatarId: string;
		onFavoriteToggle?: (favorited: boolean) => void;
		class?: string;
	} = $props();

	let favorited = $state(false);
	let favoritedAt: string | undefined = $state('');

	onMount(async () => {
		const d = await api.vrckit.users.current.favoriteAvatars.fetch(avatarId);
		favorited = d.favorited;
		favoritedAt = d.created_at;
	});

	async function toggleFavorite() {
		favorited = !favorited;
		onFavoriteToggle?.(favorited);
		if (favorited) {
			favoritedAt = new Date().toISOString();
			const success = await api.vrckit.users.current.favoriteAvatars.put(avatarId);
			if (success) {
				api.toast.success('Avatar favorited', { duration: 1000 });
			} else {
				favoritedAt = undefined;
				api.toast.success('Failed to favorite', { duration: 1000 });
			}
		} else {
			favoritedAt = undefined;
			await api.vrckit.users.current.favoriteAvatars.delete(avatarId);
			api.toast.success('Avatar unfavorited', { duration: 1000 });
		}
	}
</script>

<Tooltip.Provider delayDuration={0} disableHoverableContent>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<button
				class="bg-popover text-popover-foreground flex items-center justify-center gap-1 rounded-md border p-2 {className}"
				onclick={toggleFavorite}
			>
				{#if favorited}
					<StarOff size={18} />
				{:else}
					<Star size={18} />
				{/if}
			</button>
		</Tooltip.Trigger>
		<Tooltip.Content class="flex flex-col justify-center" side="bottom">
			<div class="text-semibold text-center text-sm">
				{favorited ? 'Favorited' : 'Not favorited'}
			</div>
			{#if favoritedAt}
				<div class="text-xs text-gray-500">
					{new Date(favoritedAt).toLocaleString()}
				</div>
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
