import type { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";

export class ChatboxAFKModule extends ChatboxModule {

  afk = false;
  lastAfkAt: number | null = null;

  lastAfkDuration: number | null = null;

  constructor(public modules: Modules) {
    super(modules, "afk", "AFK", {
      description: "Afk detection module, used to detect if the user is AFK (Away From Keyboard).",
      inputs: [
        {
          type: "Boolean",
          id: "force_afk",
          name: "Force AFK",
          description: "Force the user to be AFK, even if they are not.",
          default_value: false,
        },
        {
          type: "Number",
          id: "afk_timeout_duration",
          name: "AFK Timeout Duration",
          description: "Duration in minutes after which the user is considered AFK. If the user is inactive for this duration, they will be marked as AFK.",
          default_value: 15,
        },
        {
          type: "KeyValues",
          id: "afk_text",
          name: "AFK Text",
          default_value: {
            afk: "AFK",
            not_afk: "Not AFK"
          },
          key_display_names: {
            afk: "AFK",
            not_afk: "Not AFK"
          }
        }
      ],
      example_placeholders: [
        {
          placeholder: "afk_state",
          description: "Check if the user is AFK. If the user is AFK, it will return true, otherwise false."
        },
        {
          placeholder: "afk_text",
          description: "Get the AFK text. If the user is AFK, it will return afk text."
        },
        {
          placeholder: "force_afk",
          description: "Force the user to be AFK, even if they are not. This will always return true."
        },
        {
          placeholder: "afk_since",
          description: "Get the timestamp of when the user became AFK. If the user is not AFK, it will return 0."
        },
        {
          placeholder: "afk_duration",
          description: "Get the duration of how long the user has been AFK in milliseconds. If the user is not AFK, it will return 0."
        }
      ]
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async handleSystemLayerMessage({ Type }: { Type: string, Data: any }) {
    switch (Type) {
      case "UserBecameActive": {
        this.afk = false;
        this.modules.chatbox.api.events.emit("UserAFKStateChanged", { state: false, since: this.lastAfkAt });
        this.lastAfkAt = null;
        break;
      }
      case "UserBecameInactive": {
        this.afk = true;
        this.lastAfkAt = Date.now();
        this.modules.chatbox.api.events.emit("UserAFKStateChanged", { state: true, since: this.lastAfkAt });
        break;
      }
    }
  }

  async init() {
    this.modules.chatbox.api.events.on("SystemLayerMessage", this.handleSystemLayerMessage.bind(this));
  }

  async destroy() {
    this.modules.chatbox.api.events.off("SystemLayerMessage", this.handleSystemLayerMessage.bind(this));
  }

  isAfk(): boolean {
    return this.getInputValue("force_afk") || this.afk;
  }

  setForceAfk(force: boolean) {
    this.setInputValue("force_afk", force);
    return force;
  }

  isForceAfk(): boolean {
    return this.getInputValue("force_afk");
  }

  async getPlaceholder(key: string): Promise<string> {

    const afkTimeoutDuration = this.getInputValue("afk_timeout_duration") * 60 * 1000; // Convert minutes to milliseconds
    if (this.lastAfkDuration !== afkTimeoutDuration) {
      this.lastAfkDuration = afkTimeoutDuration;
      this.modules.chatbox.api.systems.systemLayer.send("InactivityThreshold", afkTimeoutDuration);
    }

    const afkText = this.getInputValue("afk_text");
    switch (key) {
      case "afk_state": return this.isAfk() ? "true" : "false";
      case "afk_text": return this.isAfk() ? afkText.afk : afkText.not_afk;
      case "force_afk": return this.getInputValue("force_afk") ? "true" : "false";
      case "afk_since": return this.lastAfkAt ? this.lastAfkAt.toString() : "0";
      case "afk_duration": return this.lastAfkAt ? (Date.now() - this.lastAfkAt).toString() : "0";
      default: return key;
    }
  }
}