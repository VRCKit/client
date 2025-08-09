<script lang="ts">
	/* eslint-disable @typescript-eslint/no-require-imports */
	const path = require('path') as typeof import('path');
	const process = require('process') as typeof import('process');

	import * as Accordion from '$lib/components/ui/accordion/index';
	import { Bug, Network, ScanText } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { api } from '$lib/base/api';
	import { onMount } from 'svelte';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import type { ConfigData } from '$lib/base/api/list/Config';
	import * as Select from '$lib/components/ui/select/index';

	const cfg = $state<Record<string, any>>({
		VRChatAmplitudeCachePath: path.join(
			process.env.TEMP as string,
			'./VRChat/VRChat/amplitude.cache'
		),
		HTTPProxy: {
			enabled: false,
			http: 'http://217.18.208.147:8080',
			https: 'http://217.18.208.147:8080'
		}
	});

	function updateValues() {
		Object.keys(cfg).forEach((key: string) => {
			api.config.get(key as keyof ConfigData).then((value) => {
				cfg[key] = value ?? cfg[key];
			});
		});
	}

	onMount(() => {
		updateValues();
	});
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<div class="flex h-full w-full items-center justify-center p-2">
	<Accordion.Root type="single" class="w-[70%]" value="cache-scanner">
		<Accordion.Item value="cache-scanner">
			<Accordion.Trigger>
				<div class="flex items-center justify-start gap-2">
					<ScanText size={24} />
					Cache Scanner
				</div>
			</Accordion.Trigger>
			<Accordion.Content class="w-[70%]">
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="cache-file">VRChat Amplitude Cache Path</Label>
					<Label for="cache-file" class="text-sm font-normal text-gray-500">
						The directory where VRChat stores its amplitude cache file. If you don't know what this
						is, you probably shouldn't change it.
					</Label>
					<div class="flex w-full gap-2">
						<Input
							id="cache-file"
							class="w-[250px]"
							clearButton={false}
							bind:value={cfg.VRChatAmplitudeCachePath}
							readonly
						/>
						<Button
							variant="outline"
							onclick={async () => {
								const res = await api.ipcRenderer.invoke('ShowDialog', {
									mode: 'open',
									defaultPath: cfg.VRChatAmplitudeCachePath,
									filters: [
										{
											name: 'Amplitude Cache',
											extensions: ['cache']
										}
									]
								});
								const filePath = res.filePaths[0];
								await api.config.set('VRChatAmplitudeCachePath', filePath ?? null);
								window.location.href = '/';
							}}>Change</Button
						>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="http-proxy">
			<Accordion.Trigger>
				<div class="flex items-center justify-start gap-2">
					<Network size={24} />
					HTTP(s) Proxy
				</div>
			</Accordion.Trigger>
			<Accordion.Content class="w-[70%]">
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="http-proxy">Use HTTP(s) Proxy</Label>
					<Label for="http-proxy" class="text-sm font-normal text-gray-500">
						You can use a HTTP proxy to route all cors requests through it.
					</Label>
					<div class="flex w-full gap-2">
						<Select.Root
							type="single"
							value={cfg.HTTPProxy.enabled ? 'true' : 'false'}
							onValueChange={(value) => {
								cfg.HTTPProxy.enabled = value === 'true';
								api.config.set('HTTPProxy', $state.snapshot(cfg.HTTPProxy));
								window.location.href = '/';
							}}
						>
							<Select.Trigger class="w-[180px]"
								>{cfg.HTTPProxy.enabled ? 'Enabled' : 'Disabled'}</Select.Trigger
							>
							<Select.Content>
								<Select.Item value="true">Yes, use HTTP proxy.</Select.Item>
								<Select.Item value="false">No, don't use proxy.</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="http-proxy">HTTP Proxy</Label>
					<Label for="http-proxy" class="text-sm font-normal text-gray-500">
						You can use a HTTP proxy to route all cors requests through it.
					</Label>
					<div class="flex w-full gap-2">
						<Input
							id="http-proxy"
							class="w-[250px]"
							bind:value={cfg.HTTPProxy.http}
							placeholder="http://1.2.3.4:8080"
						/>
						<Button
							variant="outline"
							onclick={async () => {
								await api.config.set('HTTPProxy', $state.snapshot(cfg.HTTPProxy));
								window.location.href = '/';
							}}>Apply</Button
						>
					</div>
				</div>
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="https-proxy">HTTPs Proxy</Label>
					<Label for="https-proxy" class="text-sm font-normal text-gray-500">
						You can use a HTTPs proxy to route all cors requests through it.
					</Label>
					<div class="flex w-full gap-2">
						<Input
							id="https-proxy"
							class="w-[250px]"
							bind:value={cfg.HTTPProxy.https}
							placeholder="http(s)://1.2.3.4:8443"
						/>
						<Button
							variant="outline"
							onclick={async () => {
								await api.config.set('HTTPProxy', $state.snapshot(cfg.HTTPProxy));
								window.location.href = '/';
							}}>Apply</Button
						>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>
		<Accordion.Item value="debug">
			<Accordion.Trigger>
				<div class="flex items-center justify-start gap-2">
					<Bug size={24} />
					Debug
				</div>
			</Accordion.Trigger>
			<Accordion.Content class="w-[70%]">
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="reload">Reload</Label>
					<Label for="reload" class="text-sm font-normal text-gray-500">
						This will reload the app and makes your client up to date.
					</Label>
					<div class="flex w-full gap-2">
						<Button
							variant="outline"
							onclick={() => {
								window.location.href = '/';
							}}>Reload</Button
						>
					</div>
				</div>
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="clear-local-data">Clear Cache Data</Label>
					<Label for="clear-local-data" class="text-sm font-normal text-gray-500">
						This will clear the cache data stored by VRCKit. This includes the avatar caches.
					</Label>
					<div class="flex w-full gap-2">
						<Dialog.Root>
							<Dialog.Trigger>
								<Button variant="destructive">Clear</Button>
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
									<Dialog.Description>This action cannot be undone.</Dialog.Description>
								</Dialog.Header>

								<Button
									variant="destructive"
									onclick={async () => {
										await api.database.avatars.clear();
										window.location.href = '/';
									}}>Clear</Button
								>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="clear-local-data">Clear Config Data</Label>
					<Label for="clear-local-data" class="text-sm font-normal text-gray-500">
						This will clear all config data stored by VRCKit. This includes VRCKit and VRChat
						authorization data too.
					</Label>
					<div class="flex w-full gap-2">
						<Dialog.Root>
							<Dialog.Trigger>
								<Button variant="destructive">Clear</Button>
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
									<Dialog.Description>This action cannot be undone.</Dialog.Description>
								</Dialog.Header>

								<Button
									variant="destructive"
									onclick={async () => {
										await api.config.clear();
										window.location.href = '/';
									}}>Clear</Button
								>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
				<div class="mb-4 flex flex-col gap-1 p-1">
					<Label for="clear-local-data">Clear All Local Data</Label>
					<Label for="clear-local-data" class="text-sm font-normal text-gray-500">
						Deletes all local data stored by VRCKit. This includes the cache scanner data and the
						avatar cache. Also authorization and other settings.
					</Label>
					<div class="flex w-full gap-2">
						<Dialog.Root>
							<Dialog.Trigger>
								<Button variant="destructive">Clear</Button>
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
									<Dialog.Description>This action cannot be undone.</Dialog.Description>
								</Dialog.Header>

								<Button
									variant="destructive"
									onclick={async () => {
										await api.database.clear();
										window.location.href = '/';
									}}>Clear</Button
								>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
</div>
