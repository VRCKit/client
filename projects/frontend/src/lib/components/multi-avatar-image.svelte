<script lang="ts">
	import { api } from '$lib/base/api';

	const {
		avatarIds,
		alt
	}: {
		avatarIds: string[];
		alt?: string;
	} = $props();
</script>

<div class="h-full w-full">
	{#if avatarIds.length === 1}
		<img
			src={api.utils.avatarImageURL(avatarIds[0])}
			draggable="false"
			{alt}
			class="h-full w-full rounded-md object-cover"
		/>
	{:else}
		<div class="grid h-full w-full grid-cols-2 overflow-hidden rounded-md contain-content">
			{#each avatarIds as avatarId}
				<img
					src={api.utils.avatarImageURL(avatarId)}
					draggable="false"
					{alt}
					class="h-full w-full object-cover"
				/>
			{/each}
		</div>
	{/if}
</div>
