<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Avatar } from '$lib/base/api/list/VRCKit/Avatars';
	import { debounce } from '$lib/utils';
	import { api } from '$lib/base/api';

	const {
		card,
		avatars
	}: {
		card: Snippet<[{ avatar: Avatar }]>;
		avatars: Avatar[];
	} = $props();

</script>

<div class="flex flex-1 flex-wrap justify-center gap-4">
	{#each avatars as avatar (avatar.id)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex"
		>
			{@render card({
				avatar
			})}
		</div>
	{/each}
</div>
