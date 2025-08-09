<script lang="ts">
	import { Pagination as PaginationPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		count = 0,
		perPage = 10,
		page = $bindable(1),
		siblingCount = 1,
		...restProps
	}: PaginationPrimitive.RootProps = $props();
</script>

<PaginationPrimitive.Root
	bind:ref
	class={cn('flex w-[440px] flex-col', className)}
	{count}
	{perPage}
	{siblingCount}
	bind:page
	{...restProps}
/>
