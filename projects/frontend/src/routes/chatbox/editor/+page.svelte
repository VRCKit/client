<script lang="ts">
	import { api } from '$lib/base/api';
	import * as Accordion from '$lib/components/ui/accordion/index';
	import { Label } from '$lib/components/ui/label/index';
	import { Button } from '$lib/components/ui/button/index';
	import * as Card from '$lib/components/ui/card/index';
	import {
		BetweenHorizontalStart,
		ChevronsUpDown,
		CircleHelp,
		Copy,
		EllipsisVertical,
		Keyboard,
		KeyboardOff,
		ListRestart,
		Plus
	} from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index';
	import * as Dialog from '$lib/components/ui/dialog/index';
	import { Input } from '$lib/components/ui/input/index';
	import * as Select from '$lib/components/ui/select/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import { Checkbox } from '$lib/components/ui/checkbox/index';
	import { Textarea } from '$lib/components/ui/textarea/index';
	import * as Collapsible from '$lib/components/ui/collapsible/index';
	import * as Popover from '$lib/components/ui/popover/index';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { onMount } from 'svelte';
	import _ from 'lodash';
	import { DefaultChatboxConfig } from '$lib/base/api/list/Chatbox';
	import CreateChatboxProfileDialogContent from '$lib/components/create-chatbox-profile-dialog-content.svelte';
	import { goto } from '$app/navigation';
	import { ChatboxAFKModule } from '$lib/base/api/list/Chatbox/Modules/list/ChatboxAFKModule';

	let selectedTab = $state('');

	let otherData = $state<Record<string, any>>({});
	let reRenderMap = $state<Record<string, number>>({});
	let chatboxConfig = $state(api.chatbox.getConfig());

	function reRender(key: string) {
		[...Object.keys(reRenderMap), key].forEach((k) => {
			if (k.startsWith(key)) {
				reRenderMap[k] = (reRenderMap[k] || 0) + 1;
			}
		});
	}

	let template = $state('');
	let processedTemplate = $state('');

	async function processTemplate() {
		let config = api.chatbox.getConfig();
		let text = await api.chatbox.modules.fillTemplate(config.template);
		if (config.trimTemplate) text = text.trim();
		processedTemplate = text;
	}

	const debouncedProcessTemplate = _.debounce(processTemplate, 250);

	$effect(() => {
		template;
		debouncedProcessTemplate();
	});

	let isPremium = $state(false);

	onMount(() => {
		template = api.chatbox.getConfig().template;

		let processInterval = setInterval(processTemplate, 1000);
		processTemplate();

		otherData['force_afk'] = (api.chatbox.modules.list.get('afk') as ChatboxAFKModule).isForceAfk();
		reRender(`afk;force_afk`);

		api.chatbox.modules.isPremium().then((v) => {
			isPremium = v;
		});

		return () => {
			clearInterval(processInterval);
		};
	});
</script>

<svelte:head>
	<title>Chatbox Editor</title>
</svelte:head>

<div class="relative h-[var(--full-height)] w-[var(--full-width)]">
	<ScrollArea class="relative h-[var(--full-height)] ">
		<div class="flex w-full flex-col gap-4 p-4">
			<Collapsible.Root>
				<Collapsible.Trigger class="flex items-center justify-between gap-2">
					<div class="flex flex-col gap-2">
						<Label class="cursor-pointer text-lg">Chatbox Modules</Label>
						<p class="text-sm font-normal text-gray-500">
							Modules are the building blocks of a chatbox template. They can be used to add various
							features to your chatbox. They are adding various placeholders to the chatbox
							template.
						</p>
					</div>
					<Button variant="outline" size="icon" class="min-w-10">
						<ChevronsUpDown />
					</Button>
				</Collapsible.Trigger>
				<Collapsible.Content>
					<Accordion.Root type="single" bind:value={selectedTab}>
						{#each api.chatbox.modules.list as [, m] (m.id)}
							<Accordion.Item value={m.id}>
								<Accordion.Trigger>
									<div class="flex w-full items-center justify-between gap-2 pr-2">
										<div class="flex items-center justify-start gap-2">
											<div>
												{m.name}
											</div>
											<div class="text-sm font-normal text-gray-500">
												{m.config.description}
											</div>
										</div>
										{#if m.config.is_premium && !isPremium}
											<a
												href="/premium"
												class="rounded-md border border-yellow-500 px-2 py-1 text-sm drop-shadow-[0_0px_4px_#d6a40d]"
												>Premium</a
											>
										{/if}
									</div>
								</Accordion.Trigger>
								<Accordion.Content>
									<div class="flex flex-col gap-2">
										<Card.Root class="w-full">
											<Card.Content class="p-2">
												<div class="flex flex-col gap-2">
													<Card.Title class="text-lg">Example Placeholders</Card.Title>
													<div class="flex flex-wrap gap-2">
														{#each m.getExamplePlaceholders() as ph}
															<ContextMenu.Root>
																<ContextMenu.Trigger>
																	<Tooltip.Provider delayDuration={150}>
																		<Tooltip.Root>
																			<Tooltip.Trigger>
																				<Button
																					variant="outline"
																					size="sm"
																					onclick={() => {
																						api.utils.copyText(ph.normal);
																					}}>{ph.normal}</Button
																				>
																			</Tooltip.Trigger>
																			<Tooltip.Content class="text-center">
																				{ph.description}
																			</Tooltip.Content>
																		</Tooltip.Root>
																	</Tooltip.Provider>
																</ContextMenu.Trigger>
																<ContextMenu.Content>
																	<ContextMenu.Item
																		onclick={() => {
																			api.utils.copyText(ph.normal);
																		}}
																		class="flex cursor-pointer items-center gap-2"
																	>
																		<Copy size={18} />
																		Copy Normal
																	</ContextMenu.Item>
																	<ContextMenu.Item
																		onclick={() => {
																			api.utils.copyText(ph.inner);
																		}}
																		class="flex cursor-pointer items-center gap-2"
																	>
																		<Copy size={18} />
																		Copy Inner
																	</ContextMenu.Item>
																</ContextMenu.Content>
															</ContextMenu.Root>
														{/each}
													</div>
												</div>
											</Card.Content>
										</Card.Root>
										{#if (m.config.inputs || []).length === 0}
											<Card.Root class="w-full">
												<Card.Content class="p-2">
													<div class="flex flex-col gap-2">
														<Card.Title class="text-lg">No inputs</Card.Title>
														<Card.Description class="text-sm font-normal text-gray-500">
															This module has no inputs.
														</Card.Description>
													</div>
												</Card.Content>
											</Card.Root>
										{/if}
										{#each m.config.inputs || [] as inp}
											{@const renderKey = `${m.id};${inp.id}`}
											<div class="flex flex-col gap-2">
												<Card.Root class="w-full">
													<Card.Content class="p-2">
														<div class="flex flex-col gap-2">
															<div class="flex items-start justify-between">
																<div class="flex flex-col gap-2">
																	<Card.Title class="text-lg">{inp.name}</Card.Title>
																	{#if inp.description}
																		<Card.Description class="text-sm font-normal text-gray-500">
																			{inp.description}
																		</Card.Description>
																	{/if}
																</div>
																<div class="flex gap-2">
																	{#if inp.help}
																		<Tooltip.Provider>
																			<Tooltip.Root>
																				<Tooltip.Trigger>
																					<Button
																						variant="outline"
																						size="icon"
																						onclick={() => {
																							api.shell.openExternal(inp.help!.url);
																						}}
																					>
																						<CircleHelp />
																					</Button>
																				</Tooltip.Trigger>
																				<Tooltip.Content>
																					{inp.help!.message}
																				</Tooltip.Content>
																			</Tooltip.Root>
																		</Tooltip.Provider>
																	{/if}
																	<Dialog.Root
																		onOpenChange={(v) =>
																			(otherData[`${renderKey};reset_modal_open`] = v)}
																		open={otherData[`${renderKey};reset_modal_open`]}
																	>
																		<Dialog.Trigger>
																			<Tooltip.Provider>
																				<Tooltip.Root>
																					<Tooltip.Trigger>
																						<Button variant="outline" size="icon">
																							<ListRestart />
																						</Button>
																					</Tooltip.Trigger>
																					<Tooltip.Content>
																						Reset the inputs to its default values.
																					</Tooltip.Content>
																				</Tooltip.Root>
																			</Tooltip.Provider>
																		</Dialog.Trigger>
																		<Dialog.Content>
																			<Dialog.Header>
																				<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
																				<Dialog.Description
																					>This action cannot be undone.</Dialog.Description
																				>
																			</Dialog.Header>

																			<Button
																				variant="destructive"
																				onclick={() => {
																					if (typeof inp.default_value === 'object') {
																						m.setInputValue(inp.id, {
																							...inp.default_value
																						});
																					} else {
																						m.setInputValue(inp.id, inp.default_value);
																					}
																					reRender(renderKey);
																					delete otherData[`${renderKey};reset_modal_open`];
																				}}>Reset</Button
																			>
																		</Dialog.Content>
																	</Dialog.Root>
																</div>
															</div>
															<div class="flex">
																{#if inp.type == 'Text' || inp.type == 'Number'}
																	<div class="normal">
																		{#key reRenderMap[renderKey]}
																			<Input
																				type={inp.type == 'Number' ? 'number' : 'text'}
																				value={m.getInputValue(inp.id)}
																				clearButton={false}
																				oninput={(e) => {
																					m.setInputValue(
																						inp.id,
																						(e.target as HTMLInputElement).value
																					);
																				}}
																			/>
																		{/key}
																	</div>
																{:else if inp.type == 'Select'}
																	<div class="select">
																		{#key reRenderMap[renderKey]}
																			<Select.Root
																				type="single"
																				value={m.getInputValue(inp.id)}
																				onValueChange={(str) => {
																					m.setInputValue(inp.id, str);
																					reRender(renderKey);
																				}}
																			>
																				<Select.Trigger class="w-[180px]"
																					>{inp.options.find(
																						(i) => i.value === m.getInputValue(inp.id)
																					)?.name || m.getInputValue(inp.id)}</Select.Trigger
																				>
																				<Select.Content>
																					{#each inp.options as opt}
																						<Select.Item value={opt.value}>{opt.name}</Select.Item>
																					{/each}
																				</Select.Content>
																			</Select.Root>
																		{/key}
																	</div>
																{:else if inp.type == 'Boolean'}
																	<div class="boolean">
																		{#key reRenderMap[renderKey]}
																			<Checkbox
																				checked={m.getInputValue(inp.id)}
																				onCheckedChange={(v) => {
																					m.setInputValue(inp.id, v);
																				}}
																			/>
																		{/key}
																	</div>
																{:else if inp.type == 'KeyValues'}
																	<div class="flex w-full flex-col gap-2">
																		{#key reRenderMap[renderKey]}
																			<div class="flex w-full flex-col gap-2">
																				<div class="flex w-full flex-col gap-2">
																					{#each Object.entries(m.getInputValue(inp.id) || []) as [key, value]}
																						<div class="flex w-full flex-col justify-between gap-2">
																							<Label for="{renderKey};{key}">
																								{inp.key_display_names?.[key] || key}
																							</Label>
																							<div class="relative flex w-full items-center">
																								<Textarea
																									id="{renderKey};{key}"
																									rows={3}
																									placeholder={inp.placeholder ||
																										'Enter value here...'}
																									value={value as string}
																									class="w-full"
																									onchange={(e) => {
																										const obj = m.getInputValue(inp.id);
																										obj[key] = (e.target as HTMLInputElement).value;
																										m.setInputValue(inp.id, obj);
																									}}
																								/>

																								{#if inp.allow_custom_keys}
																									<Dialog.Root
																										onOpenChange={(v) =>
																											(otherData[
																												`${renderKey};${key};delete_modal`
																											] = v)}
																										open={otherData[
																											`${renderKey};${key};delete_modal`
																										]}
																									>
																										<Dialog.Trigger>
																											<Tooltip.Provider>
																												<Tooltip.Root>
																													<Tooltip.Trigger>
																														<div class="absolute right-2 top-2">
																															<Button
																																variant="outline"
																																onclick={() => {
																																	const obj = m.getInputValue(
																																		inp.id
																																	);
																																	delete obj[key];
																																	m.setInputValue(inp.id, obj);
																																	reRender(renderKey);
																																}}>Delete</Button
																															>
																														</div>
																													</Tooltip.Trigger>
																													<Tooltip.Content>
																														Delete this key-value pair.
																													</Tooltip.Content>
																												</Tooltip.Root>
																											</Tooltip.Provider>
																										</Dialog.Trigger>
																										<Dialog.Content>
																											<Dialog.Header>
																												<Dialog.Title
																													>Are you sure absolutely sure?</Dialog.Title
																												>
																												<Dialog.Description
																													>This action cannot be undone.</Dialog.Description
																												>
																											</Dialog.Header>

																											<Button
																												variant="destructive"
																												onclick={() => {
																													if (
																														typeof inp.default_value === 'object'
																													) {
																														m.setInputValue(inp.id, {
																															...inp.default_value
																														});
																													} else {
																														m.setInputValue(
																															inp.id,
																															inp.default_value
																														);
																													}
																													reRender(renderKey);
																													delete otherData[
																														`${renderKey};reset_modal_open`
																													];
																												}}>Reset</Button
																											>
																										</Dialog.Content>
																									</Dialog.Root>
																								{/if}
																							</div>
																						</div>
																					{/each}
																				</div>
																				{#if inp.allow_custom_keys}
																					<div class="flex w-full items-center gap-2">
																						<Input
																							placeholder="Key"
																							bind:value={otherData[`${renderKey};custom_key`]}
																						/>
																						<Button
																							variant="outline"
																							disabled={!otherData[
																								`${renderKey};custom_key`
																							]?.trim?.()}
																							onclick={() => {
																								const customKey =
																									otherData[`${renderKey};custom_key`];
																								const obj = m.getInputValue(inp.id);
																								obj[customKey] = '';
																								otherData[`${renderKey};custom_key`] = '';
																								m.setInputValue(inp.id, obj);
																								reRender(renderKey);
																							}}>Add</Button
																						>
																					</div>
																				{/if}
																			</div>
																		{/key}
																	</div>
																{/if}
															</div>
														</div>
													</Card.Content>
												</Card.Root>
											</div>
										{/each}
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/each}
					</Accordion.Root>
				</Collapsible.Content>
			</Collapsible.Root>
			<Card.Root class="w-full">
				<Card.Content class="p-2">
					<div class="flex flex-col gap-2">
						<div class="flex flex-col gap-2">
							<div class="flex items-start justify-between gap-2">
								<Card.Title class="text-lg">Text Template</Card.Title>
								<div class="flex items-center gap-2">
									<Tooltip.Provider>
										<Tooltip.Root delayDuration={0} disableCloseOnTriggerClick>
											<Tooltip.Trigger>
												<Button
													variant="outline"
													size="icon"
													onclick={() => {
														otherData[`force_afk`] = !otherData[`force_afk`];
														const m = api.chatbox.modules.list.get('afk') as ChatboxAFKModule;
														m.setForceAfk(otherData[`force_afk`]);
														reRender(`afk;force_afk`);
													}}
												>
													{#if otherData[`force_afk`]}
														<KeyboardOff />
													{:else}
														<Keyboard />
													{/if}
												</Button>
											</Tooltip.Trigger>
											<Tooltip.Content
												>Toggle afk mode to {otherData[`force_afk`]
													? 'disabled'
													: 'enabled'}.</Tooltip.Content
											>
										</Tooltip.Root>
									</Tooltip.Provider>
									<Dialog.Root
										onOpenChange={(v) => (otherData[`reset_template_modal_open`] = v)}
										open={otherData[`reset_template_modal_open`]}
									>
										<Dialog.Trigger>
											<Tooltip.Provider>
												<Tooltip.Root delayDuration={0}>
													<Tooltip.Trigger>
														<Button variant="outline" size="icon">
															<ListRestart />
														</Button>
													</Tooltip.Trigger>
													<Tooltip.Content>Reset the template to its default value.</Tooltip.Content
													>
												</Tooltip.Root>
											</Tooltip.Provider>
										</Dialog.Trigger>
										<Dialog.Content>
											<Dialog.Header>
												<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
												<Dialog.Description>This action cannot be undone.</Dialog.Description>
											</Dialog.Header>

											<Button
												variant="destructive"
												onclick={() => {
													template = DefaultChatboxConfig.template;
													api.chatbox.setConfig({ template: DefaultChatboxConfig.template });
													delete otherData[`reset_template_modal_open`];
												}}>Reset</Button
											>
										</Dialog.Content>
									</Dialog.Root>
									<Dialog.Root
										onOpenChange={(v) => (otherData[`publish_template_modal_open`] = v)}
										open={otherData[`publish_template_modal_open`]}
									>
										<Dialog.Trigger>
											<Tooltip.Provider>
												<Tooltip.Root delayDuration={0}>
													<Tooltip.Trigger>
														<Button variant="outline" size="icon">
															<Plus />
														</Button>
													</Tooltip.Trigger>
													<Tooltip.Content>Publish your profile.</Tooltip.Content>
												</Tooltip.Root>
											</Tooltip.Provider>
										</Dialog.Trigger>
										<Dialog.Content>
											<CreateChatboxProfileDialogContent
												onClose={() => {
													delete otherData[`publish_template_modal_open`];
													goto('/chatbox/profiles', { replaceState: true });
												}}
											/>
										</Dialog.Content>
									</Dialog.Root>
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
														<Label for="autoTemplateEnabled">Auto Template</Label>
														<Label
															for="autoTemplateEnabled"
															class="text-sm font-normal text-gray-500"
														>
															Auto template is sends your template to the chatbox automatically.
														</Label>
													</div>
													<Checkbox
														id="autoTemplateEnabled"
														checked={chatboxConfig.autoTemplateEnabled}
														onCheckedChange={(v) => {
															chatboxConfig.autoTemplateEnabled = v;
															api.chatbox.setConfig({ autoTemplateEnabled: v });
															if (!v) {
																api.chatbox.send('', true);
															}
														}}
													/>
												</div>
												<div class="flex w-full items-start justify-between gap-2">
													<div class="flex flex-1 flex-col gap-2">
														<Label for="egg">Egg</Label>
														<Label for="egg" class="text-sm font-normal text-gray-500">
															Egg mode makes your vrchat chatbox messages background transparent.
															And makes it look like an egg.
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
													<Label for="auto_template_update_condition"
														>Auto Template Update Condition</Label
													>
													<Label
														for="auto_template_update_condition"
														class="text-sm font-normal text-gray-500"
													>
														When the placeholder is updated, the template will be sent to the
														chatbox. Blank means it will be always sent.
													</Label>
													<Input
														id="auto_template_update_condition"
														value={chatboxConfig.autoTemplateUpdateCondition}
														oninput={(e) => {
															const value = (e.target as HTMLInputElement).value as string;
															chatboxConfig.autoTemplateUpdateCondition = value;
															api.chatbox.setConfig({ autoTemplateUpdateCondition: value });
														}}
														clearButton={false}
													/>
												</div>
												<div class="flex w-full items-start justify-between gap-2">
													<div class="flex flex-1 flex-col gap-2">
														<Label for="trimTemplate">Trim Template</Label>
														<Label for="trimTemplate" class="text-sm font-normal text-gray-500">
															Trim the template before sending it to the chatbox.
														</Label>
													</div>
													<Checkbox
														id="trimTemplate"
														checked={chatboxConfig.trimTemplate}
														onCheckedChange={(v) => {
															chatboxConfig.trimTemplate = v;
															api.chatbox.setConfig({ trimTemplate: v });
														}}
													/>
												</div>
											</div>
										</Popover.Content>
									</Popover.Root>
								</div>
							</div>
							<Card.Description>
								This is the text template that will be used to send messages in the chatbox. You can
								use the placeholders from the modules to add dynamic content to the template.
							</Card.Description>
						</div>
						<div class="flex w-full gap-2">
							<ScrollArea class="flex h-[196px] w-[196px] min-w-[196px]">
								<div class="flex w-[384px] flex-col gap-4">
									{#each api.chatbox.modules.list as [, m] (m.id)}
										<div class="flex w-full flex-col gap-2">
											<Label class="text-md">{m.name}</Label>
											<div class="flex w-full flex-col gap-1">
												{#each m.getExamplePlaceholders() as ph}
													<ContextMenu.Root>
														<ContextMenu.Trigger>
															<Tooltip.Provider delayDuration={150}>
																<Tooltip.Root>
																	<Tooltip.Trigger>
																		<Button
																			variant="outline"
																			size="sm"
																			class="w-[196px]"
																			onclick={() => {
																				template += ` ${ph.normal}`;
																				api.chatbox.setConfig({ template });
																			}}>{ph.normal}</Button
																		>
																	</Tooltip.Trigger>
																	<Tooltip.Content class="w-[196px] text-center">
																		{ph.description}
																	</Tooltip.Content>
																</Tooltip.Root>
															</Tooltip.Provider>
														</ContextMenu.Trigger>
														<ContextMenu.Content>
															<ContextMenu.Item
																onclick={() => {
																	template += ` ${ph.normal}`;
																	api.chatbox.setConfig({ template });
																}}
																class="flex cursor-pointer items-center gap-2"
															>
																<BetweenHorizontalStart size={18} />
																Insert Normal
															</ContextMenu.Item>
															<ContextMenu.Item
																onclick={() => {
																	api.utils.copyText(ph.normal);
																}}
																class="flex cursor-pointer items-center gap-2"
															>
																<Copy size={18} />
																Copy Normal
															</ContextMenu.Item>
															<ContextMenu.Separator />
															<ContextMenu.Item
																onclick={() => {
																	template += ` ${ph.inner}`;
																	api.chatbox.setConfig({ template });
																}}
																class="flex cursor-pointer items-center gap-2"
															>
																<BetweenHorizontalStart size={18} />
																Insert Inner
															</ContextMenu.Item>
															<ContextMenu.Item
																onclick={() => {
																	api.utils.copyText(ph.inner);
																}}
																class="flex cursor-pointer items-center gap-2"
															>
																<Copy size={18} />
																Copy Inner
															</ContextMenu.Item>
														</ContextMenu.Content>
													</ContextMenu.Root>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</ScrollArea>
							<Textarea
								bind:value={template}
								rows={5}
								placeholder="Type your template here..."
								class="resize-none text-center"
								oninput={(e) => {
									template = (e.target as HTMLInputElement).value;
									api.chatbox.setConfig({ template });
								}}
							/>
							<Textarea
								bind:value={processedTemplate}
								rows={5}
								readonly
								class="resize-none text-center"
							/>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</ScrollArea>
</div>
