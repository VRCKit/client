import type { VRCKitAPI } from "../../VRCKitAPI";
import { VRChatAccounts, type VRChatAccount } from "./VRChatAccounts";

export interface ConfigData {
  VRChatAmplitudeCachePath: string;

  VRCKitAuth: {
    token: string;
    refresh_token: string;
    expires_at: string;
  }

  VRChatAccounts: VRChatAccount[]

  HTTPProxy: {
    enabled: boolean;
    http?: string;
    https?: string;
  }

  LastSeenLegalDate: string;
}

export class Config {
  vrchatAccounts = new VRChatAccounts(this);

  constructor(public api: VRCKitAPI) { }

  async get<T extends keyof ConfigData>(key: T, defaultValue: ConfigData[T] | null = null): Promise<ConfigData[T] | null> {
    return await this.api.database.keyValues.get(`Config;${key}`, defaultValue);
  }

  async set<T extends keyof ConfigData>(key: T, value: ConfigData[T] | null) {
    await this.api.database.keyValues.set(`Config;${key}`, value);
  }

  async clear() {
    await this.api.database.keyValues.clear((kv) => kv.key.startsWith("Config;"));
  }

  async init() {
    await this.vrchatAccounts.init();
  }

  async destroy() {
    await this.vrchatAccounts.destroy();
  }
}
