import type { VRCKit } from ".";

type AuthResponse = {
  id: string;
  auth: {
    token: string;
    refresh_token: string;
    expires_at: string;
  }
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export class Auth {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  authInterval: any;
  constructor(public vrckit: VRCKit) { }

  async init() {
    this.intervalHandler();
    this.authInterval = setInterval(async () => this.intervalHandler(), 60 * 1000);
  }

  async destroy() {
    if (this.authInterval) clearInterval(this.authInterval);
  }

  async intervalHandler() {
    const auth = await this.vrckit.api.config.get("VRCKitAuth");
    if (!auth) return;
    this.vrckit.users.current.keepAlive();

    const expiresAt = new Date(auth.expires_at);
    if (!(Date.now() > (expiresAt.getTime() - 60000 * 10))) return;

    try {
      await this.refresh(auth.token, auth.refresh_token);
    } catch {
      await this.logout(auth.token);
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.vrckit.api.http.fetch({
      method: "POST",
      url: "/authorization/login",
      baseURL: this.vrckit.api.constants.VRCKitApiBaseUrl,
      data: {
        email,
        password: await hashPassword(password)
      },
      side: "Client"
    });

    if (res.status !== 200) throw new Error(`Failed to login: ${res.status} ${res.data?.error}`);

    await this.vrckit.api.config.set("VRCKitAuth", res.data.auth);
    this.vrckit.api.events.emit("VRCKitAuthSuccess");
    return res.data;
  }

  async register(email: string, password: string, displayName: string, refId: string): Promise<AuthResponse> {
    const res = await this.vrckit.api.http.fetch({
      method: "POST",
      url: "/authorization/register",
      baseURL: this.vrckit.api.constants.VRCKitApiBaseUrl,
      data: {
        email,
        password: await hashPassword(password),
        display_name: displayName,
        reference_id: refId
      },
      side: "Client"
    });

    if (res.status !== 200) throw new Error(`Failed to register: ${res.status} ${JSON.stringify(res.data)}`);

    await this.vrckit.api.config.set("VRCKitAuth", res.data.auth);
    this.vrckit.api.events.emit("VRCKitAuthSuccess");
    return res.data;
  }

  async refresh(token: string, refreshToken: string): Promise<AuthResponse | null> {
    const res = await this.vrckit.api.http.fetch({
      method: "POST",
      url: "/authorization/refresh",
      baseURL: this.vrckit.api.constants.VRCKitApiBaseUrl,
      data: {
        token,
        refresh_token: refreshToken,
      },
      side: "Client"
    });

    if (res.status !== 200) throw new Error(`Failed to refresh: ${res.status} ${res.data?.error}`);

    await this.vrckit.api.config.set("VRCKitAuth", res.data.auth);
    return res.data;
  }

  async logout(token?: string) {
    if (token) {
      await this.vrckit.api.http.fetch({
        method: "POST",
        url: "/authorization/refresh",
        baseURL: this.vrckit.api.constants.VRCKitApiBaseUrl,
        data: {
          token,
        },
        side: "Client"
      });
    }
    await this.vrckit.api.config.set("VRCKitAuth", null);
  }

  async resetPasswordRequest(email: string): Promise<boolean> {
    const res = await this.vrckit.api.http.fetch({
      method: "POST",
      url: "/authorization/password/reset/request",
      baseURL: this.vrckit.api.constants.VRCKitApiBaseUrl,
      data: {
        email
      },
      side: "Client"
    });

    if (res.status !== 200) throw new Error(`Failed to reset password request: ${res.status} ${res.data?.error}`);

    return !!res.data.success;
  }

  async resetPasswordConfirm(resetId: string, newPassword: string): Promise<boolean> {
    const res = await this.vrckit.api.http.fetch({
      method: "POST",
      url: "/authorization/password/reset/confirm",
      baseURL: this.vrckit.api.constants.VRCKitApiBaseUrl,
      data: {
        reset_id: resetId,
        new_password: await hashPassword(newPassword)
      },
      side: "Client"
    });

    if (res.status !== 200) throw new Error(`Failed to reset password confirm: ${res.status} ${res.data?.error}`);

    return !!res.data.success;
  }

  async getAuthToken(): Promise<string | null> {
    const data = await this.vrckit.api.config.get("VRCKitAuth");
    if (!data?.expires_at) return null;
    if (new Date(data.expires_at) < new Date()) return null;
    return data.token;
  }

  async isLoggedIn() {
    return !!(await this.getAuthToken());
  }
}