<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs/index';
	import * as Card from '$lib/components/ui/card/index';
	import * as InputOTP from '$lib/components/ui/input-otp/index';
	import { Button } from '$lib/components/ui/button/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { Separator } from '$lib/components/ui/separator/index';
	import { api } from '$lib/base/api';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Checkbox } from '$lib/components/ui/checkbox/index';

	let cfg = $state({
		tab: 'VRChat' as 'VRChat' | 'VRCKit',
		vrchat_logged_in: false,
		vrchat_username: '',
		vrchat_password: '',
		vrchat_otp_type: '',
		vrchat_otp_code: '',
		vrchat_auth_cookie: '',
		vrchat_step: 1,
		vrckit_logged_in: false,
		vrckit_email: '',
		vrckit_display_name: '',
		vrckit_password: '',
		vrckit_refrence_id: '',
		vrckit_type: 'Login' as 'Register' | 'Login' | 'ForgotPassword' | 'ResetPassword',
		vrckit_password_reset_id: '',
		vrckit_tos_accepted: false,
		loading: false
	});

	onMount(async () => {
		await api.http.init();
		await api.vrchat.init();
		cfg.vrchat_logged_in = await api.vrchat.auth.isLoggedIn();
		cfg.vrckit_logged_in = await api.vrckit.auth.isLoggedIn();

		cfg.vrckit_email = (await api.database.keyValues.get<string>('VRCKitLoginEmail', ''))!!;

		if (page.url.searchParams.has('cfg')) {
			const urlCfg = JSON.parse(decodeURIComponent(page.url.searchParams.get('cfg') || '{}'));
			cfg = { ...$state.snapshot(cfg), ...urlCfg };
		}

		if (cfg.vrchat_logged_in && !cfg.vrckit_logged_in) {
			api.toast.info('Please login into VRCKit', { duration: 3000 });
			cfg.tab = 'VRCKit';
		} else if (cfg.vrchat_logged_in && cfg.vrckit_logged_in) {
			if (!['ResetPassword', 'ForgotPassword'].includes(cfg.vrckit_type)) {
				api.toast.success('You are already logged in to VRChat and VRCKit', { duration: 3000 });
				if (page.url.searchParams.get('force') !== 'true') window.location.href = '/';
			}
		} else {
			api.toast.info('Please login into VRChat', { duration: 3000 });
		}
	});

	async function vrchatLogin1() {
		cfg.loading = true;

		try {
			const res = await api.vrchat.auth.loginStep1(cfg.vrchat_username, cfg.vrchat_password);
			if (res.nextStep.length > 0) {
				cfg.vrchat_auth_cookie = res.auth.value;
				cfg.vrchat_otp_type = res.nextStep.includes('emailotp') ? 'emailotp' : 'totp';
				cfg.vrchat_step = 2;
				api.toast.info('Please enter the verification code', { duration: 3000 });
			} else {
				api.toast.success('Successfully logged in to VRChat', { duration: 3000 });
			}
		} catch (e) {
			console.error(e);
			api.toast.error('Failed to login to VRChat', { description: `${e}`, duration: 6000 });
			const errorString = `${e}`;
			if (errorString.includes('window._cf')) {
				api.toast.warning("It looks like you're experiencing issues due to Cloudflare.", {
					description: 'Would you like to use our proxy to bypass issues caused by Cloudflare?',
					action: {
						label: 'Yes, please!',
						async onClick() {
							api.toast.info('Enabling proxy.', {
								description: 'Please login after page reload.'
							});
							await api.config.set('HTTPProxy', {
								enabled: true,
								http: 'http://217.18.208.147:8080',
								https: 'http://217.18.208.147:8080'
							});
							window.location.href = '/';
						}
					},
					duration: 10000
				});
			}
		}

		cfg.loading = false;
	}

	async function vrchatLogin2() {
		cfg.loading = true;

		try {
			await api.vrchat.auth.loginStep2(
				cfg.vrchat_username,
				cfg.vrchat_auth_cookie,
				cfg.vrchat_otp_type,
				cfg.vrchat_otp_code
			);

			api.toast.success('Successfully logged in to VRChat', { duration: 3000 });

			cfg.vrchat_logged_in = true;

			if (!cfg.vrckit_logged_in) {
				api.toast.info('Please login into VRCKit', { duration: 3000 });
				cfg.tab = 'VRCKit';
			} else {
				api.toast.success('You are already logged in to VRChat and VRCKit', { duration: 3000 });
				window.location.href = '/';
			}
		} catch (e) {
			console.error(e);
			api.toast.error('Failed to verify the code', { description: `${e}`, duration: 6000 });
		}

		cfg.loading = false;
	}

	async function vrckitLogin() {
		if (!cfg.vrckit_email || !cfg.vrckit_password) {
			api.toast.error('Please enter the email and password', { duration: 3000 });
			return;
		}
		cfg.loading = true;

		try {
			await api.vrckit.auth.login(cfg.vrckit_email, cfg.vrckit_password);
			await api.database.keyValues.set('VRCKitLoginEmail', cfg.vrckit_email);
			api.toast.success('Successfully logged in to VRCKit', { duration: 3000 });
			window.location.href = '/';
		} catch (e) {
			console.error(e);
			api.toast.error('Failed to login to VRCKit', { description: `${e}`, duration: 6000 });
		}

		cfg.loading = false;
	}

	async function vrckitRegister() {
		cfg.loading = true;

		try {
			await api.vrckit.auth.register(
				cfg.vrckit_email,
				cfg.vrckit_password,
				cfg.vrckit_display_name,
				cfg.vrckit_refrence_id
			);
			await api.database.keyValues.set('VRCKitLoginEmail', cfg.vrckit_email);
			api.toast.success('Successfully registered to VRCKit', { duration: 3000 });
			window.location.href = '/';
		} catch (e) {
			console.error(e);
			api.toast.error('Failed to register to VRCKit', { description: `${e}`, duration: 6000 });
		}

		cfg.loading = false;
	}

	async function vrckitResetPasswordRequest() {
		if (!cfg.vrckit_email) {
			api.toast.error('Please enter the email', { duration: 3000 });
			return;
		}

		cfg.loading = true;

		try {
			await api.vrckit.auth.resetPasswordRequest(cfg.vrckit_email);
			api.toast.success('Password reset request sent.', {
				duration: 3000,
				description: 'Please check your email for the reset link.'
			});
		} catch (e) {
			console.error(e);
			api.toast.error('Failed to send password reset request', {
				description: `${e}`,
				duration: 6000
			});
		}

		cfg.loading = false;
	}

	async function vrckitResetPasswordConfirm() {
		if (!cfg.vrckit_password || !cfg.vrckit_password_reset_id) {
			api.toast.error('Please enter the new password', { duration: 3000 });
			return;
		}

		cfg.loading = true;

		try {
			await api.vrckit.auth.resetPasswordConfirm(cfg.vrckit_password_reset_id, cfg.vrckit_password);
			api.toast.success('Password reset successfully.', { duration: 3000 });
			cfg.vrckit_type = 'Login';
			cfg.vrckit_password = '';
		} catch (e) {
			console.error(e);
			api.toast.error('Failed to reset password', { description: `${e}`, duration: 6000 });
		}

		cfg.loading = false;
	}
</script>

<svelte:head>
	<title>Authorization</title>
</svelte:head>

<div class="flex h-[var(--full-height)] w-full items-center justify-center">
	<Tabs.Root value={cfg.tab} class="w-[400px]">
		<Tabs.List class="grid w-full grid-cols-2 gap-1">
			<Tabs.Trigger value="VRChat" disabled={cfg.vrchat_logged_in}>VRChat</Tabs.Trigger>
			<Tabs.Trigger value="VRCKit">VRCKit</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="VRChat">
			<Card.Root>
				<Card.Header>
					<Card.Title>VRChat</Card.Title>
					<Card.Description>
						{#if cfg.vrchat_step === 1}
							Login to your own VRChat account here. This will you allow to change avatars in
							real-time.
						{:else if cfg.vrchat_otp_type === 'emailotp'}
							Please check your email for the verification code.
						{:else}
							Please enter the verification code from your authenticator app.
						{/if}
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if cfg.vrchat_step === 1}
						<div class="space-y-1">
							<Label for="username">Username or Email</Label>
							<Input id="username" bind:value={cfg.vrchat_username} />
						</div>
						<div class="space-y-1">
							<Label for="password">Password</Label>
							<Input
								id="password"
								bind:value={cfg.vrchat_password}
								type="password"
								onkeyup={(e) => {
									if (e.key === 'Enter') {
										vrchatLogin1();
									}
								}}
							/>
						</div>
					{:else}
						<InputOTP.Root
							maxlength={6}
							bind:value={cfg.vrchat_otp_code}
							onkeyup={(e) => {
								if (e.key === 'Enter') {
									vrchatLogin2();
								}
							}}
						>
							{#snippet children({ cells })}
								<InputOTP.Group>
									{#each cells as cell}
										<InputOTP.Slot {cell} />
									{/each}
								</InputOTP.Group>
							{/snippet}
						</InputOTP.Root>
					{/if}
				</Card.Content>
				<Card.Footer>
					{#if cfg.vrchat_step === 1}
						<Button disabled={cfg.loading} onclick={vrchatLogin1}>
							{cfg.loading ? 'Loading..' : 'Login'}
						</Button>
					{:else}
						<Button disabled={cfg.loading} onclick={vrchatLogin2}>Verify</Button>
					{/if}
				</Card.Footer>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="VRCKit">
			<Card.Root>
				<Card.Header>
					<Card.Title>VRCKit</Card.Title>
					<Card.Description>
						<div class="space-y-1">
							<p class="text-muted-foreground text-sm">
								Login to your own VRCKit account here. This will do the all magic!
							</p>
						</div>
						<Separator class="my-2" />
						<div class="flex h-5 items-center space-x-2 text-sm">
							<button
								class={cfg.vrckit_type === 'Login'
									? 'cursor-default text-white'
									: 'cursor-pointer hover:underline'}
								onclick={() => (cfg.vrckit_type = 'Login')}
							>
								Login
							</button>
							<Separator orientation="vertical" />
							<button
								class={cfg.vrckit_type === 'Register'
									? 'cursor-default text-white'
									: 'cursor-pointer hover:underline'}
								onclick={() => (cfg.vrckit_type = 'Register')}
							>
								Register
							</button>
							{#if cfg.vrckit_type === 'ForgotPassword' || cfg.vrckit_type === 'ResetPassword'}
								<Separator orientation="vertical" />
								<button class="cursor-default text-white">
									{cfg.vrckit_type === 'ForgotPassword' ? 'Forgot Password' : 'Reset Password'}
								</button>
							{/if}
						</div>
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if cfg.vrckit_type === 'Register'}
						<div class="space-y-1">
							<Label for="email">Email</Label>
							<Input id="email" bind:value={cfg.vrckit_email} />
						</div>
						<div class="space-y-1">
							<Label for="display_name">Display Name</Label>
							<Input id="display_name" bind:value={cfg.vrckit_display_name} />
						</div>
						<div class="space-y-1">
							<Label for="password">Password</Label>
							<Input id="password" type="password" bind:value={cfg.vrckit_password} />
						</div>
						<div class="space-y-1">
							<Label for="refrence_id">Reference Id</Label>
							<Input
								id="refrence_id"
								bind:value={cfg.vrckit_refrence_id}
								onkeyup={(e) => {
									if (e.key === 'Enter' && cfg.vrckit_tos_accepted) {
										vrckitRegister();
									}
								}}
							/>
						</div>
						<div class="pt-2">
							<div class="flex items-center gap-2">
								<Checkbox
									id="vrckit_tos_accepted"
									bind:checked={cfg.vrckit_tos_accepted}
									onCheckedChange={(v) => (cfg.vrckit_tos_accepted = v)}
								/>
								<Label for="vrckit_tos_accepted">
									Accept <button
										class="cursor-pointer text-purple-500 hover:underline"
										onclick={() => {
											api.shell.openExternal('https://vrckit.com/legal/terms-of-service');
										}}
									>
										Terms of Service
									</button>
									and
									<button
										class="cursor-pointer text-purple-500 hover:underline"
										onclick={() => {
											api.shell.openExternal('https://vrckit.com/legal/privacy-policy');
										}}
									>
										Privacy Policy
									</button>
								</Label>
							</div>
						</div>
					{:else if cfg.vrckit_type === 'Login'}
						<div class="space-y-1">
							<Label for="username">Email</Label>
							<Input id="username" bind:value={cfg.vrckit_email} />
						</div>
						<div class="space-y-1">
							<Label for="password">Password</Label>
							<Input
								id="password"
								type="password"
								bind:value={cfg.vrckit_password}
								onkeyup={(e) => {
									if (e.key === 'Enter') {
										vrckitLogin();
									}
								}}
							/>
						</div>
					{:else if cfg.vrckit_type === 'ForgotPassword'}
						<div class="space-y-1">
							<Label for="username">Email</Label>
							<Input
								id="username"
								bind:value={cfg.vrckit_email}
								onkeyup={(e) => {
									if (e.key === 'Enter') {
										vrckitResetPasswordRequest();
									}
								}}
							/>
						</div>
					{:else if cfg.vrckit_type === 'ResetPassword'}
						<div class="space-y-1">
							<Label for="password">New Password</Label>
							<Input
								id="password"
								type="password"
								bind:value={cfg.vrckit_password}
								onkeyup={(e) => {
									if (e.key === 'Enter') {
										vrckitResetPasswordConfirm();
									}
								}}
							/>
						</div>
					{/if}
				</Card.Content>
				<Card.Footer>
					{#if cfg.vrckit_type === 'Register'}
						<Button disabled={cfg.loading || !cfg.vrckit_tos_accepted} onclick={vrckitRegister}>
							{cfg.loading ? 'Loading..' : 'Register'}
						</Button>
					{:else if cfg.vrckit_type === 'Login'}
						<div class="flex w-full items-end justify-between">
							<Button disabled={cfg.loading} onclick={vrckitLogin}>
								{cfg.loading ? 'Loading..' : 'Login'}
							</Button>
							<button
								onclick={() => (cfg.vrckit_type = 'ForgotPassword')}
								class="text-xs hover:underline"
							>
								Forgot Password?
							</button>
						</div>
					{:else if cfg.vrckit_type === 'ForgotPassword'}
						<Button disabled={cfg.loading} onclick={vrckitResetPasswordRequest}>
							{cfg.loading ? 'Loading..' : 'Send Email'}
						</Button>
					{:else if cfg.vrckit_type === 'ResetPassword'}
						<Button disabled={cfg.loading} onclick={vrckitResetPasswordConfirm}>
							{cfg.loading ? 'Loading..' : 'Reset Password'}
						</Button>
					{/if}
				</Card.Footer>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
