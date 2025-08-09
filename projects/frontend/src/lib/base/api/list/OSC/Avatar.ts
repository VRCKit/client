/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path") as typeof import("path");
const fs = require("original-fs") as typeof import("fs");
const chokidar = require("chokidar") as typeof import("chokidar");
const process = require("process") as typeof import("process");

import type { OSC, OSCMessage } from ".";

export type AvatarOSCSchema = {
  id: string,
  name: string,
  hash: number,
  parameters: {
    name: string,
    input: {
      address: string,
      type: "Float" | "Int" | "Bool",
    },
    output: {
      address: string,
      type: "Float" | "Int" | "Bool",
    }
  }[]
}

export type AvatarData = {
  eyeHeight: number,
  legacyFingers: boolean,
  animationParameters: {
    name: string,
    value: number
  }[]
}

const VRChatOSCBaseDir = path.join(process.env.APPDATA as string, "../LocalLow/VRChat/VRChat/OSC");
const VRChatLocalAvatarDataDir = path.join(process.env.APPDATA as string, "../LocalLow/VRChat/VRChat/LocalAvatarData");

export class Avatar {
  currentParameters: Record<string, number | boolean> = {};
  lastBaseParametersRefreshAt = 0;
  lastPrarameterUpdateAt = 0;

  constructor(public osc: OSC) { }

  /**
   * Shortcut to get the current avatar id.
   */
  get currentAvatarId() {
    return this.osc.api.utils.currentAvatarId;
  }

  async init() {
    this.osc.api.events.on("OSCMessage", this.handleOSCMessage.bind(this));
    this.osc.api.events.on("AvatarSelected", this.handleAvatarSelected.bind(this));
  }

  async destroy() {
    this.osc.api.events.off("OSCMessage", this.handleOSCMessage);
    this.osc.api.events.off("AvatarSelected", this.handleAvatarSelected);
  }

  private async handleAvatarSelected({ id }: { id: string, from: "OSC" | "VRCKit" | "VRChat" }) {
    this.currentParameters = {};
    const jsonPath = this.avatarDataFilePath(id);
    const watcher = chokidar.watch(jsonPath);
    let done = false;
    const timeoutId = setTimeout(() => {
      if (!done) {
        watcher.removeAllListeners();
        watcher.close();
      }
    }, 60 * 1000 * 5);
    watcher.on("all", async (event) => {
      if (event !== "change" && event !== "add") return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (this.currentAvatarId !== id) return;
      await this.refreshBaseParameters();
      done = true;
      watcher.removeAllListeners();
      watcher.close();
      clearTimeout(timeoutId);
      this.osc.api.events.emit("OSCAvatarSelected", { id });
    });

  }

  private async handleOSCMessage(message: OSCMessage) {
    if (message.address !== "/avatar/change" && message.address.startsWith("/avatar/")) {
      let value = message.args[0];
      if (typeof value === "number") value = parseFloat(value.toFixed(3));
      if (value === 0) value = 0.001;
      this.currentParameters[message.address] = value;
      this.lastPrarameterUpdateAt = Date.now();
      this.osc.api.events.emit("OSCAvatarParameterUpdate", { address: message.address, value });
    }
  }

  async loadParameters(parameters: Record<string, number | boolean>, avatarId: string | null = null) {
    if (!avatarId) avatarId = this.currentAvatarId;
    if (!avatarId) return false;

    if (this.currentAvatarId !== avatarId) {
      const success = await this.osc.api.utils.selectAvatar(avatarId, true);
      if (!success) return false;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    Object.entries(parameters).forEach(([address, value]) => {
      this.osc.send(address, value);
    });

    return true;
  }

  async refreshBaseParameters() {
    const currentAvatarId = this.currentAvatarId;
    if (!currentAvatarId) return false;
    const avatarSchema = await this.fetchOSCSchema(currentAvatarId);
    if (!avatarSchema) return false;
    const avatarData = await this.fetchAvatarData(currentAvatarId);
    if (!avatarData) return false;

    avatarSchema.parameters.forEach((param) => {
      if (param.input) {
        const animParam = avatarData.animationParameters.find(i => i.name === param.name);
        if (animParam) {
          let value = animParam.value;
          if (typeof value === "number") value = parseFloat(value.toFixed(3));
          if (value === 0) value = 0.001;
          this.currentParameters[param.input.address] = value;
        }
      }
    });

    this.lastBaseParametersRefreshAt = Date.now();

    return true;
  }

  async fetchOSCSchema(avatarId: string) {
    const jsonPath = path.join(VRChatOSCBaseDir, this.osc.api.vrchat.users.currentUserId || "Unk", "Avatars", `${avatarId}.json`);
    if (!fs.existsSync(jsonPath)) return null;
    return JSON.parse((await fs.promises.readFile(jsonPath, "utf8")).trim()) as AvatarOSCSchema;
  }

  avatarDataFilePath(avatarId: string) {
    return path.join(VRChatLocalAvatarDataDir, this.osc.api.vrchat.users.currentUserId || "Unk", `${avatarId}`);
  }

  async fetchAvatarData(avatarId: string) {
    const jsonPath = this.avatarDataFilePath(avatarId);
    if (!fs.existsSync(jsonPath)) return null;

    return JSON.parse((await fs.promises.readFile(jsonPath, "utf8")).trim()) as AvatarData;
  }
}