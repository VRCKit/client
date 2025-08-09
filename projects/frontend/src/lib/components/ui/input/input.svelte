<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import type { WithElementRef } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { X } from 'lucide-svelte';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined }) & {
				clearButton?: boolean;
				onClear?: () => void;
			}
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		clearButton = true,
		onClear,
		files = $bindable(),
		class: className,
		...restProps
	}: Props = $props();
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		class={cn(
			'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<div class="relative">
		<input
			bind:this={ref}
			class={cn(
				'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				className
			)}
			{type}
			bind:value
			{...restProps}
		/>
		<X
			data-visible={value && type !== 'number' && clearButton}
			class="bg-bg-opacity-75 pointer-events-none absolute right-1 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-md bg-gray-950 bg-opacity-75 p-1 opacity-0 transition-all hover:bg-opacity-100 data-[visible=true]:pointer-events-auto data-[visible=true]:opacity-100"
			onclick={() => {
				value = '';
				onClear?.();
			}}
			size={22}
		></X>
	</div>
{/if}
