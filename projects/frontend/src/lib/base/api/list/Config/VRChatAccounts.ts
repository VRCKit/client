import type { Config } from ".";

export type VRChatAccount = {
  selected: boolean;
  username: string;
  id?: string;
  display_name?: string;
  last_login_at: number;
  auth_cookie?: {
    expires_at: number;
    value: string;
  },
  two_factor_auth_cookie?: {
    expires_at: number;
    value: string;
  }
};

export class VRChatAccounts {
  constructor(public config: Config) { }

  async getRawAccounts() {
    return (await this.config.get("VRChatAccounts", []))!;
  }

  async setRawAccounts(accounts: VRChatAccount[]) {
    await this.config.set("VRChatAccounts", accounts);
  }

  async removeAccount(username: string) {
    const accounts = await this.getRawAccounts();
    const existingAccountIndex = accounts.findIndex(account => account.username.toLowerCase() === username.toLowerCase());
    const account = accounts[existingAccountIndex];
    if (existingAccountIndex === -1) return false;
    accounts.splice(existingAccountIndex, 1);
    await this.setRawAccounts(accounts);
    if (account.selected) {
      const newSelectedAccount = accounts[0];
      if (newSelectedAccount) {
        await this.setSelectedAccount(newSelectedAccount.username);
      } else {
        await this.config.api.database.keyValues.set(`VRChat;CurrentUser`, null);
        await this.config.api.database.keyValues.set(`VRChat;LastCurrentUserFetchAt`, 0);
      }
    }
    return true;
  }

  async updateAccount(cfg: {
    username: string;
    display_name?: string;
    id?: string;
    auth_cookie?: {
      expires_at: number;
      value: string;
    };
    two_factor_auth_cookie?: {
      expires_at: number;
      value: string;
    };
  }) {
    const accounts = await this.getRawAccounts();
    const existingAccountIndex = accounts.findIndex(account => account.username.toLowerCase() === cfg.username.toLowerCase());
    if (existingAccountIndex !== -1) {
      accounts[existingAccountIndex] = {
        ...accounts[existingAccountIndex],
        ...cfg,
        last_login_at: Date.now()
      };
      await this.setRawAccounts(accounts);
      return true;
    }
    accounts.push({
      ...cfg,
      selected: false,
      last_login_at: Date.now()
    });
    await this.setRawAccounts(accounts);
    await this.setSelectedAccount(cfg.username);
    return true;
  }

  async getSelectedAccount() {
    const accounts = await this.getRawAccounts();
    return await this.getAccount(accounts.find(account => account.selected)?.username ?? accounts[0]?.username ?? "");
  }

  async setSelectedAccount(username: string) {
    const accounts = await this.getRawAccounts();
    const account = accounts.find(account => account.username.toLowerCase() === username.toLowerCase());
    if (!account) return false;
    accounts.forEach(account => account.selected = false);
    account.selected = true;
    await this.setRawAccounts(accounts);
    await this.config.api.database.keyValues.set(`VRChat;CurrentUser`, null);
    await this.config.api.database.keyValues.set(`VRChat;LastCurrentUserFetchAt`, 0);
    return true;
  }

  async getAccount(username: string) {
    const accounts = await this.getRawAccounts();
    const account = accounts.find(account => account.username.toLowerCase() === username.toLowerCase());
    if (!account) return null;
    return {
      username: account.username,
      display_name: account.display_name,
      last_login_at: account.last_login_at,
      auth_cookie: account.auth_cookie,
      two_factor_auth_cookie: account.two_factor_auth_cookie,
      get is_expired() {
        return (this.auth_cookie ? Date.now() > this.auth_cookie.expires_at : false) || (this.two_factor_auth_cookie ? Date.now() > this.two_factor_auth_cookie?.expires_at : false);
      },
      get full_cookie() {
        if (this.is_expired) return null;
        return `auth=${this.auth_cookie?.value}${this.two_factor_auth_cookie ? `;twoFactorAuth=${this.two_factor_auth_cookie.value}` : ""}`;
      }
    }
  }

  async init() {
    const accounts = await this.getRawAccounts();
    const selectedAccount = accounts.find(account => account.selected);
    if (!selectedAccount && accounts.length > 0) {
      accounts[0].selected = true;
      await this.setRawAccounts(accounts);
      window.location.href = "/";
    }
  }

  async destroy() {

  }
}
