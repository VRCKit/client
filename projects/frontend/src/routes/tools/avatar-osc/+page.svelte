<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Highlight } from 'svelte-highlight';
	import jsonLang from 'svelte-highlight/languages/json';
	import { api } from '$lib/base/api';
	import { Braces, RefreshCcw } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { AvatarOSCSchema } from '$lib/base/api/list/OSC/Avatar';
	import * as Card from '$lib/components/ui/card/index';
	import * as Select from '$lib/components/ui/select/index';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Slider } from '$lib/components/ui/slider/index';
	import _ from 'lodash';

	let currentParameters: Record<string, number | boolean> = $state({});

	let currentAvatarId: string | null = $state(null);
	let currentOSCSchema: AvatarOSCSchema | null = $state(null);

	let filterValue = $state('');

	async function updateParameters(from = 'memory' as 'memory' | 'filesystem', noToast = false) {
		switch (from) {
			case 'memory':
				if (!noToast) api.toast.success('Refreshed from memory.');
				break;
			case 'filesystem':
				const success = await api.osc.avatar.refreshBaseParameters();
				if (!noToast) {
					if (success) {
						api.toast.success('Refreshed from filesystem.');
					} else {
						api.toast.error('Failed to refresh.');
					}
				}
				break;
		}
		currentParameters = { ...api.osc.avatar.currentParameters };
	}

	async function updateData() {
		currentOSCSchema = await api.osc.avatar.fetchOSCSchema(currentAvatarId!);
		updateParameters('memory', true);
	}

	const parameters = $derived.by(() => {
		if (!currentOSCSchema) return [];
		const search = filterValue.trim().toLowerCase();
		if (!search) return currentOSCSchema.parameters;
		switch (search) {
			case 'bool':
			case 'boolean':
				return currentOSCSchema.parameters.filter((param) => param.input?.type === 'Bool');
			case 'float':
				return currentOSCSchema.parameters.filter((param) => param.input?.type === 'Float');
			case 'int':
				return currentOSCSchema.parameters.filter((param) => param.input?.type === 'Int');
		}
		return (
			currentOSCSchema?.parameters.filter((param) => {
				return param.name.toLowerCase().includes(search);
			}) ?? []
		);
	});

	const debouncedValueChange = _.debounce((address: string, value: boolean | number) => {
		currentParameters[address] = value;
		api.osc.send(address, value);
	}, 50);

	onMount(() => {
		currentAvatarId = api.utils.currentAvatarId;
		updateData();

		function handleAvatarSelected({ id }: { id: string }) {
			api.toast.success('Got avatar update from OSC.');
			currentAvatarId = id;
			updateData();
		}

		function handleAvatarParameterUpdated({ address, value }: { address: string; value: number }) {
			currentParameters[address] = value;
		}

		api.events.on('OSCAvatarSelected', handleAvatarSelected);
		api.events.on('OSCAvatarParameterUpdate', handleAvatarParameterUpdated);
		return () => {
			api.events.off('OSCAvatarSelected', handleAvatarSelected);
			api.events.off('OSCAvatarParameterUpdate', handleAvatarParameterUpdated);
		};
	});
</script>

<svelte:head>
	<title>Avatar OSC Editor</title>
</svelte:head>

<div class="relative w-full">
	<ScrollArea class="h-full w-full">
		<div
			class="fixed z-10 flex w-[var(--full-width)] items-center justify-between bg-black bg-opacity-75 p-2"
		>
			<div class="flex items-center gap-2">
				<Dialog.Root>
					<Dialog.Trigger>
						<Tooltip.Provider delayDuration={0} disableCloseOnTriggerClick>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button variant="outline" onclick={() => updateParameters('memory', true)}>
										<Braces /> View Parameters
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>View current avatar raw osc parameters</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</Dialog.Trigger>
					<Dialog.Content class="w-[800px] min-w-[800px]" style="-webkit-app-region: no-drag;">
						<Dialog.Header>
							<Dialog.Title>Current Parameters</Dialog.Title>
						</Dialog.Header>
						<div class="flex gap-2">
							<Tooltip.Provider delayDuration={0} disableHoverableContent>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button onclick={() => updateParameters('memory')} variant="default">
											<RefreshCcw />
											From Memory
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content class="max-w-64 text-center">
										Refresh avatar parameters from memory. For example it's useful when you just
										changed avatar parameters from the expressions etc.
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
							<Tooltip.Provider delayDuration={0} disableHoverableContent>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button onclick={() => updateParameters('filesystem')} variant="outline">
											<RefreshCcw />
											From Filesystem
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content class="max-w-64 text-center">
										Refresh avatar parameters from the filesystem. For example it's useful when you
										just reset the avatar etc.
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						</div>
						<ScrollArea orientation="both" class="max-h-[500px] rounded-md">
							<Highlight language={jsonLang} code={JSON.stringify(currentParameters, null, 2)} />
						</ScrollArea>
					</Dialog.Content>
				</Dialog.Root>
				<Dialog.Root>
					<Dialog.Trigger>
						<Tooltip.Provider delayDuration={0} disableCloseOnTriggerClick>
							<Tooltip.Root>
								<Tooltip.Trigger>
									<Button variant="outline" onclick={() => updateParameters('memory', true)}>
										<Braces /> View Schema
									</Button>
								</Tooltip.Trigger>
								<Tooltip.Content>View current avatar raw schema</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</Dialog.Trigger>
					<Dialog.Content class="w-[800px] min-w-[800px]" style="-webkit-app-region: no-drag;">
						<Dialog.Header>
							<Dialog.Title>Current Schema</Dialog.Title>
						</Dialog.Header>
						<ScrollArea orientation="both" class="max-h-[500px] rounded-md">
							<Highlight language={jsonLang} code={JSON.stringify(currentOSCSchema, null, 2)} />
						</ScrollArea>
					</Dialog.Content>
				</Dialog.Root>
			</div>
			<div class="flex">
				<Input bind:value={filterValue} placeholder="Filter" class="w-[200px]" />
			</div>
		</div>
		<div class="flex h-full w-full flex-col gap-4 p-4 pt-16">
			{#if currentOSCSchema}
				{#each parameters as param}
					<Card.Root>
						<Card.Content class="p-2">
							<div class="flex flex-col gap-2">
								<Card.Title>{param.name}</Card.Title>
								{#if param.input}
									<div class="flex flex-col gap-1 border-l-2 p-2">
										<div class="text-lg font-semibold">Input</div>
										<div class="flex justify-between">
											<div class="flex flex-col gap-1">
												<div class="flex gap-1 text-sm">
													<div class="font-semibold">Address:</div>
													<div>{param.input.address}</div>
												</div>
												<div class="flex gap-1 text-sm">
													<div class="font-semibold">Type:</div>
													<div>{param.input.type}</div>
												</div>
											</div>
											<div class="flex flex-col items-end gap-4">
												<div class="text-lg font-semibold">Control</div>
												{#if param.input.type === 'Bool'}
													<Select.Root
														type="single"
														onValueChange={(value) => {
															const calcValue = value === 'true';
															currentParameters[param.input.address] = calcValue;
															debouncedValueChange(param.input.address, calcValue);
														}}
														value={currentParameters[param.input.address] ? 'true' : 'false'}
													>
														<Select.Trigger class="w-[125px]">
															{currentParameters[param.input.address] ? 'True' : 'False'}
														</Select.Trigger>
														<Select.Content>
															<Select.Item value="true">True</Select.Item>
															<Select.Item value="false">False</Select.Item>
														</Select.Content>
													</Select.Root>
												{:else if param.input.type === 'Float'}
													<div class="flex flex-col gap-4">
														<Slider
															type="single"
															class="w-[125px]"
															value={(currentParameters[param.input.address] as number) ?? 0.001}
															min={0.001}
															max={0.999}
															step={0.001}
															onValueChange={(value) =>
																debouncedValueChange(param.input.address, value)}
														/>
														<Input
															type="number"
															class="w-[125px]"
															step="0.001"
															min="0.001"
															max="0.999"
															value={currentParameters[param.input.address] ?? 0.001}
															oninput={(e) => {
																const value = parseFloat((e.target as HTMLInputElement).value);
																debouncedValueChange(param.input.address, value);
															}}
														/>
													</div>
												{:else if param.input.type === 'Int'}
													<Input
														type="number"
														class="w-[125px]"
														step="1"
														value={parseInt(
															currentParameters[param.input.address]?.toString() ?? '0'
														)}
														oninput={(e) => {
															const value = parseFloat((e.target as HTMLInputElement).value);
															debouncedValueChange(param.input.address, value);
														}}
													/>
												{/if}
											</div>
										</div>
									</div>
								{/if}
								{#if param.output}
									<div class="flex flex-col gap-1 border-l-2 p-2">
										<div class="text-lg font-semibold">Output</div>
										<div class="flex justify-between">
											<div class="flex flex-col gap-1">
												<div class="flex gap-1 text-sm">
													<div class="font-semibold">Address:</div>
													<div>{param.output.address}</div>
												</div>
												<div class="flex gap-1 text-sm">
													<div class="font-semibold">Type:</div>
													<div>{param.output.type}</div>
												</div>
												<div class="flex gap-1 text-sm">
													<div class="font-semibold">Value:</div>
													<div>{currentParameters[param.output.address] ?? 'Unknown'}</div>
												</div>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			{/if}
		</div>
	</ScrollArea>
</div>
