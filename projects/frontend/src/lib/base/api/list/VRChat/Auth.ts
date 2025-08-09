import cookieParser from "set-cookie-parser";

import type { VRChat } from ".";

export class Auth {
  constructor(public vrchat: VRChat) { }

  async loginStep1(username: string, password: string) {
    const res = await this.vrchat.api.http.fetch({
      method: "GET",
      url: "/auth/user",
      baseURL: this.vrchat.api.constants.VRChatApiBaseUrl,
      headers: {
        "User-Agent": this.vrchat.userAgent,
        "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
      },
      side: "Server"
    });

    const cookies = cookieParser.parse(res.headers["set-cookie"] ?? "");
    const authCookie = cookies.find(cookie => cookie.name === "auth");

    if (!authCookie) throw new Error(`Failed to login: ${JSON.stringify(res.data)}`);

    await this.vrchat.api.config.vrchatAccounts.updateAccount({
      username,
      display_name: res.data.displayName,
      auth_cookie: {
        value: authCookie.value,
        expires_at: authCookie.expires!.getTime()
      },
      two_factor_auth_cookie: undefined // Will be set in step 2 if needed
    });
    await this.vrchat.api.config.vrchatAccounts.setSelectedAccount(username);

    return {
      auth: {
        value: authCookie.value,
        expires: authCookie.expires
      },
      nextStep: (res.data.requiresTwoFactorAuth ?? []).map((i: string) => i.toLowerCase()) as string[]
    };
  }

  async loginStep2(username: string, authCookie: string, otpType: string, code: string) {
    const res = await this.vrchat.api.http.fetch({
      method: "POST",
      url: `/auth/twofactorauth/${otpType}/verify`,
      baseURL: this.vrchat.api.constants.VRChatApiBaseUrl,
      headers: {
        "User-Agent": this.vrchat.userAgent,
        "Cookie": `auth=${authCookie}`,
        "Content-Type": "application/json"
      },
      data: JSON.stringify({ code }),
      side: "Server"
    });

    const cookies = cookieParser.parse(res.headers?.["set-cookie"] ?? "");
    const twoFactorAuthCookie = cookies.find(i => i.name === "twoFactorAuth");

    if (!twoFactorAuthCookie) throw new Error(`Failed to login: ${JSON.stringify(res.data)}`);

    await this.vrchat.api.config.vrchatAccounts.updateAccount({
      username,
      two_factor_auth_cookie: {
        value: twoFactorAuthCookie.value,
        expires_at: twoFactorAuthCookie.expires!.getTime()
      }
    });
    await this.vrchat.api.config.vrchatAccounts.setSelectedAccount(username);
    const currentUser = await this.vrchat.users.fetchCurrent();
    await this.vrchat.api.config.vrchatAccounts.updateAccount({
      username,
      display_name: currentUser.displayName,
      id: currentUser.id
    });
    this.vrchat.api.events.emit("VRChat;AuthSuccess");

    return {
      twoFactorAuth: {
        value: twoFactorAuthCookie.value,
        expires: twoFactorAuthCookie.expires
      }
    };
  }

  async getAuthCookies(): Promise<string | null> {
    const account = await this.vrchat.api.config.vrchatAccounts.getSelectedAccount();
    if (!account) return null;
    return account.full_cookie || null;
  }

  async logout() {
    const account = await this.vrchat.api.config.vrchatAccounts.getSelectedAccount();
    if (!account) return null;
    await this.vrchat.api.config.vrchatAccounts.removeAccount(account.username);
    await this.vrchat.api.database.keyValues.set(`VRChat;CurrentUser`, null);
    await this.vrchat.api.database.keyValues.set(`VRChat;LastCurrentUserFetchAt`, 0);
  }

  async isLoggedIn() {
    return !!(await this.getAuthCookies());
  }

}