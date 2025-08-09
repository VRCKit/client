import type { VRCKitAPI } from "../../VRCKitAPI";
import { Modules } from "./Modules";

export type ChatboxConfig = {
  egg: boolean;
  chatboxResumeDelay: number;
  trimTemplate: boolean;
  autoTemplateEnabled: boolean;
  template: string;
  autoTemplateUpdateCondition: string;
}

export const DefaultChatboxConfig: ChatboxConfig = Object.freeze({
  egg: false,
  autoSendWhileTyping: false,
  autoTemplateEnabled: true,
  trimTemplate: true,
  chatboxResumeDelay: 10000,
  template: [
    `{{shortcut;media_if_playing}}`,
    `🕛 {{time;date_time}}`,
  ].join("\n"),
  autoTemplateUpdateCondition: ""
});

export class Chatbox {
  modules = new Modules(this);
  lastPausedAt = 0;
  updateInterval: number | null = null;
  private _config: ChatboxConfig = { ...DefaultChatboxConfig };
  private _lastChangeConditionValue = "";
  constructor(public api: VRCKitAPI) { }

  isPaused() {
    return this.lastPausedAt > 0 && Date.now() - this.lastPausedAt < 10000;
  }

  getConfig() {
    return { ...this._config };
  }

  setConfig(value: Partial<ChatboxConfig>) {
    this._config = { ...this._config, ...value };
    this.api.database.keyValues.set("Chatbox;Config", this._config);
  }

  resetConfig() {
    this.setConfig(DefaultChatboxConfig);
  }

  unpause() {
    this.lastPausedAt = 0;
  }

  pause() {
    this.lastPausedAt = Date.now();
  }

  send(message: string, force = false) {
    if (this.isPaused() && !force) return;
    this.api.osc.chatbox.send(message, this._config.egg);
  }

  async getTemplateContent() {
    const config = this.getConfig();
    let text = await this.modules.fillTemplate(config.template);
    if (config.trimTemplate) text = text.trim();
    return text;
  }

  async init() {
    const config = (await this.api.database.keyValues.get<ChatboxConfig>("Chatbox;Config")) || {};
    this._config = { ...DefaultChatboxConfig, ...config };
    await this.modules.init();

    this.updateInterval = setInterval(async () => {
      const config = this.getConfig();
      if (!config.autoTemplateEnabled) return;

      if (config.autoTemplateUpdateCondition) {
        const condition = await this.modules.fillTemplate(config.autoTemplateUpdateCondition);
        if (condition !== this._lastChangeConditionValue) {
          this._lastChangeConditionValue = condition;
          this.send(await this.getTemplateContent());
        }
      } else {
        this.send(await this.getTemplateContent());
      }

    }, this.api.constants.ChatboxUpdateDelay) as unknown as number;
  }

  async destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    await this.modules.destroy();
  }
}