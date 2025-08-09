<script lang="ts">
	import { api } from '$lib/base/api';
	import * as Card from '$lib/components/ui/card/index';
	import { onMount, tick } from 'svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import { Button } from '$lib/components/ui/button/index';
	import {
		EllipsisVertical,
		MessageSquareOff,
		MessageSquarePlus,
		PlusIcon,
		SendIcon,
		Trash2
	} from 'lucide-svelte';
	import * as Popover from '$lib/components/ui/popover/index';
	import { Label } from '$lib/components/ui/label/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Checkbox } from '$lib/components/ui/checkbox/index';
	import { Textarea } from '$lib/components/ui/textarea/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import * as ContextMenu from '$lib/components/ui/context-menu/index';

	type MessageItem = {
		content: string;
		at: number;
		x: number;
	};

	let chatboxConfig = $state(api.chatbox.getConfig());

	let currentAvatarId: null | string = $state(null);
	let currentDisplayName: null | string = $state(null);

	let scrollElement: any | null = $state(null);

	let message = $state('');
	let templateContent = $state('');

	let messageHistory: MessageItem[] = $state([]);
	let messageTempaltes: string[] = $state([]);

	onMount(() => {
		currentAvatarId = api.utils.currentAvatarId;
		currentDisplayName = (api.vrchat.users.currentUser?.displayName as string) || null;

		api.database.keyValues.get<MessageItem[]>('Chatbox;MessageHistory').then((v) => {
			if (v) {
				messageHistory = v;
			}
		});

		api.database.keyValues.get<string[]>('Chatbox;MessageTemplates').then((v) => {
			if (v) {
				messageTempaltes = v;
			}
		});

		function handleAvatarSelected({ id }: { id: string }) {
			currentAvatarId = id;
		}

		function vrchatCurrentUserUpdated(u: { displayName: string }) {
			currentDisplayName = u.displayName;
		}

		api.events.on('AvatarSelected', handleAvatarSelected);
		api.events.on('VRChatCurrentUser', vrchatCurrentUserUpdated);
		return () => {
			api.events.off('AvatarSelected', handleAvatarSelected);
			api.events.off('VRChatCurrentUser', vrchatCurrentUserUpdated);
		};
	});

	$effect(() => {
		api.database.keyValues.set(
			'Chatbox;MessageHistory',
			JSON.parse(JSON.stringify(messageHistory.slice(-100).filter(Boolean)))
		);
	});

	$effect(() => {
		api.database.keyValues.set(
			'Chatbox;MessageTemplates',
			JSON.parse(JSON.stringify(messageTempaltes))
		);
	});

	function sendMessage(content: string, noCache = false) {
		content = content.trim();
		if (!content) return;
		let lastMessage = messageHistory.at(-1);
		let x = lastMessage?.content === content ? (lastMessage?.x || 0) + 1 : 0;
		if (!noCache) {
			messageHistory.push({
				content,
				at: Date.now(),
				x
			});
		}
		if (x) content = `${content} x${x + 1}`;

		api.chatbox.pause();
		api.chatbox.send(content, true);
	}

	$effect(() => {
		messageHistory;
		tick().then(() => {
			if (scrollElement) {
				scrollElement.scroll({
					top: scrollElement.scrollHeight,
					behavior: 'smooth'
				});
			}
		});
	});

	let clearHistoryModalOpen = $state(false);
</script>

<svelte:head>
	<title>Chatbox Messages</title>
</svelte:head>

<div class="relative flex h-[var(--full-height)] w-full flex-col gap-4">
	<div
		class="fixed z-10 flex w-[var(--full-width)] flex-row items-center justify-between bg-black bg-opacity-75 p-2"
	>
		<div class="item-center flex gap-2">
			<Dialog.Root onOpenChange={(v) => (clearHistoryModalOpen = v)} open={clearHistoryModalOpen}>
				<Dialog.Trigger>
					<Button variant="outline">
						<MessageSquareOff />
						Clear History
					</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
						<Dialog.Description>This action cannot be undone.</Dialog.Description>
					</Dialog.Header>

					<Button
						variant="destructive"
						onclick={() => {
							messageHistory = [];
							clearHistoryModalOpen = false;
						}}>Delete</Button
					>
				</Dialog.Content>
			</Dialog.Root>
		</div>
		<div class="item-center flex gap-2">
			<Popover.Root>
				<Popover.Trigger>
					<Button variant="outline" size="icon">
						<EllipsisVertical />
					</Button>
				</Popover.Trigger>
				<Popover.Content side="bottom" align="end" class="flex flex-col">
					<div class="flex flex-col gap-2 p-2">
						<div class="flex w-full items-start justify-between gap-2">
							<div class="flex flex-1 flex-col gap-2">
								<Label for="egg">Egg</Label>
								<Label for="egg" class="text-sm font-normal text-gray-500">
									Egg mode makes your vrchat chatbox messages background transparent. And makes it
									look like an egg.
								</Label>
							</div>
							<Checkbox
								id="egg"
								checked={chatboxConfig.egg}
								onCheckedChange={(v) => {
									chatboxConfig.egg = v;
									api.chatbox.setConfig({ egg: v });
								}}
							/>
						</div>
						<div class="flex flex-1 flex-col gap-2">
							<Label for="resume_delay">Resume Delay</Label>
							<Label for="resume_delay" class="text-sm font-normal text-gray-500">
								Resume delay is used to prevent the auto template from being triggered immediately
								after the user sends a message. And defined as miliseconds.
							</Label>
							<Input
								id="resume_delay"
								type="number"
								step="500"
								value={chatboxConfig.chatboxResumeDelay}
								oninput={(e) => {
									const value = parseInt((e.target as HTMLInputElement).value);
									chatboxConfig.chatboxResumeDelay = value;
									api.chatbox.setConfig({ chatboxResumeDelay: value });
								}}
								clearButton={false}
							/>
						</div>
					</div>
				</Popover.Content>
			</Popover.Root>
		</div>
	</div>
	<div class="h-full w-full px-4 pt-16">
		<Card.Root class="h-full w-full">
			<Card.Content class="h-full p-0">
				<ScrollArea class="h-[calc(var(--full-height)-235px)] w-full p-2" bind:ref={scrollElement}>
					<div class="flex flex-col gap-2">
						{#each messageHistory as msg}
							<Card.Root class="w-full">
								<Card.Content class="p-2">
									<div class="flex items-start justify-between">
										<div class="flex flex-col gap-1">
											<div class="flex items-center gap-2">
												<img
													src={api.utils.avatarImageURL(currentAvatarId)}
													alt={currentDisplayName ?? '...'}
													class="h-6 w-6 rounded-full"
												/>
												<Card.Title class="text-lg">{currentDisplayName ?? '...'}</Card.Title>
											</div>
											<Card.Description class="flex gap-1">
												{msg.content}
											</Card.Description>
										</div>
										<div class="flex flex-col items-end gap-1">
											<Card.Description class="flex gap-1">
												{new Date(msg.at).toLocaleString()}
											</Card.Description>
											<Dialog.Root>
												<Dialog.Trigger>
													<Button variant="outline" size="icon" class="text-red-500"
														><Trash2 /></Button
													>
												</Dialog.Trigger>
												<Dialog.Content>
													<Dialog.Header>
														<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
														<Dialog.Description>This action cannot be undone.</Dialog.Description>
													</Dialog.Header>

													<Button
														variant="destructive"
														onclick={async () => {
															messageHistory = messageHistory.filter((m) => m !== msg);
														}}>Delete</Button
													>
												</Dialog.Content>
											</Dialog.Root>
										</div>
									</div>
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				</ScrollArea>
			</Card.Content>
		</Card.Root>
	</div>
	<div class="relative w-full px-4">
		<ScrollArea orientation="horizontal">
			<div class="relative flex h-10 w-full gap-2 py-1">
				{#each messageTempaltes as mt}
					<Tooltip.Provider>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<ContextMenu.Root>
									<ContextMenu.Trigger>
										<Button
											variant="outline"
											size="sm"
											onclick={() => {
												sendMessage(mt);
											}}
										>
											<div class="max-w-48 truncate">{mt}</div>
										</Button>
									</ContextMenu.Trigger>
									<ContextMenu.Content>
										<ContextMenu.Item
											class="flex cursor-pointer items-center gap-2 text-red-500"
											onclick={() => {
												messageTempaltes = messageTempaltes.filter((m) => m !== mt);
											}}
										>
											<Trash2 size={18} />
											Delete
										</ContextMenu.Item>
									</ContextMenu.Content>
								</ContextMenu.Root>
							</Tooltip.Trigger>
							<Tooltip.Content>
								{mt}
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				{/each}
				<div class="absolute right-0 top-0">
					<Popover.Root>
						<Popover.Trigger>
							<Button variant="outline" size="icon">
								<MessageSquarePlus />
							</Button>
						</Popover.Trigger>
						<Popover.Content side="top" align="end">
							<div class="flex flex-1 flex-col gap-2">
								<Label for="template_content">Template Content</Label>
								<Label for="template_content" class="text-sm font-normal text-gray-500">
									Message templates are used to send messages quickly. You can add a message
									template by typing a message and clicking the plus button.
								</Label>
								<div class="flex w-full gap-2">
									<Input
										id="template_content"
										type="text"
										class="w-[200px]"
										bind:value={templateContent}
										onkeydown={(e) => {
											if (e.key === 'Enter' && templateContent.trim()) {
												messageTempaltes.push(templateContent);
												templateContent = '';
											}
										}}
									/>
									<Button
										variant="outline"
										size="icon"
										onclick={() => {
											if (!templateContent.trim()) return;
											messageTempaltes.push(templateContent);
											templateContent = '';
										}}
									>
										<PlusIcon />
									</Button>
								</div>
							</div>
						</Popover.Content>
					</Popover.Root>
				</div>
			</div>
		</ScrollArea>
	</div>
	<div class="relative w-full px-4 pb-4">
		<Button
			variant="outline"
			class="absolute bottom-6 right-6"
			onclick={() => {
				sendMessage(message);
				message = '';
			}}
		>
			<SendIcon />
			Send
		</Button>
		<Textarea
			class="w-full resize-none"
			bind:value={message}
			placeholder="Type a message..."
			onkeydown={(e) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					sendMessage(message);
					message = '';
				}
			}}
		/>
	</div>
</div>
