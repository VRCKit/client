<script lang="ts">
	import * as Card from '$lib/components/ui/card/index';
	import { Button } from '$lib/components/ui/button/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import * as Select from '$lib/components/ui/select/index';
	import { api } from '$lib/base/api';
	import { onMount } from 'svelte';
	import formatDuration from 'stuffs/lib/formatDuration.js';

	let isRunning = $state(api.systems.avatarImporter.running);
	let lastConfig = $state({ ...api.systems.avatarImporter.lastConfig });

	let importFilePath = $state(lastConfig?.filePath || '');
	let importConcurrency = $state(lastConfig?.concurrency || 2);
	let importSkipCache = $state(lastConfig?.skipCache ?? true);

	let progressCount = $state(0);
	let progressElapsed = $state(0);

	onMount(() => {
		function onRunningUpdate({ running }: { running: boolean }) {
			isRunning = running;
		}

		function onProgressUpdate({ count, elapsed }: { count: number; elapsed: number }) {
			progressCount = count;
			progressElapsed = elapsed;
		}

		api.events.on('AvatarImporterRunningUpdate', onRunningUpdate);
		api.events.on('AvatarImporterProgressUpdate', onProgressUpdate);

		return () => {
			api.events.off('AvatarImporterRunningUpdate', onRunningUpdate);
			api.events.off('AvatarImporterProgressUpdate', onProgressUpdate);
		};
	});
</script>

<svelte:head>
	<title>Avatar Importer</title>
</svelte:head>

<div class="relative flex h-full w-full flex-col p-4">
	<Card.Root>
		<Card.Content class="p-2">
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Card.Title>Mass Avatar Importer</Card.Title>
					<Card.Description>
						Mass imports avatars from list of VRChat avatar Ids. File format is a text file with one
						avatar id per line. The file can be imported from the local filesystem.
					</Card.Description>
				</div>
				<div class="flex flex-col gap-2">
					<div class="mb-4 flex flex-col gap-2">
						<Label for="mass-file-path">File Path</Label>
						<div class="flex w-full gap-2">
							<Input
								id="mass-file-path"
								class="w-[600px]"
								clearButton={false}
								value={importFilePath}
								readonly
								disabled={isRunning}
							/>
							<Button
								variant="outline"
								disabled={isRunning}
								onclick={async () => {
									const res = await api.ipcRenderer.invoke('ShowDialog', {
										mode: 'open',
										filters: [
											{
												name: 'Text Files',
												extensions: ['txt']
											}
										]
									});
									const filePath = res.filePaths[0];
									importFilePath = filePath;
								}}>Change</Button
							>
						</div>
					</div>
					<div class="mb-4 flex flex-col gap-2">
						<Label for="mass-concurrency">Concurrency</Label>
						<Label for="mass-concurrency" class="text-sm font-normal text-gray-500">
							Concurrency is the number of avatars that will be imported at the same time. The
							higher the number, the faster the import will be, but it may cause issues with your
							VRChat account if set too high. Recommended value is 2.
						</Label>
						<div class="flex w-full gap-2">
							<Input
								id="mass-concurrency"
								class="w-[250px]"
								clearButton={false}
								bind:value={importConcurrency}
								type="number"
								disabled={isRunning}
							/>
						</div>
					</div>
					<div class="mb-4 flex flex-col gap-2">
						<Label for="skip-cache">Skip Cache</Label>
						<Label for="skip-cache" class="text-sm font-normal text-gray-500">
							If enabled, the importer will skip the cache and do not save the avatars to the cache.
							This will make the import faster. But you can't acces them from cache tab.
						</Label>
						<div class="flex w-full gap-2">
							<Select.Root
								type="single"
								onValueChange={(value) => {
									importSkipCache = value === 'true';
								}}
								value={importSkipCache ? 'true' : 'false'}
								disabled={isRunning}
							>
								<Select.Trigger class="w-[125px]">
									{importSkipCache ? 'Yes' : 'No'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="true">Yes, Skip Cache</Select.Item>
									<Select.Item value="false">Don't Skip Cache</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						class="w-[150px]"
						disabled={isRunning || !importFilePath}
						onclick={() => {
							api.systems.avatarImporter.importAvatars(
								importFilePath,
								importConcurrency,
								importSkipCache
							);
							isRunning = true;
						}}>{isRunning ? 'Importing...' : 'Start Importing'}</Button
					>
					<Card.Description class="text-xs font-normal text-gray-500">
						Avatars Imported: {progressCount}<br />
						Elapsed Time: {formatDuration(progressElapsed) || '0 seconds'}
					</Card.Description>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
