/* eslint-disable @typescript-eslint/no-explicit-any */

import type { VRCKitAPI } from "../../VRCKitAPI";
import { Avatar } from "./Avatar";
import { Chatbox } from "./Chatbox";

/* eslint-disable @typescript-eslint/no-require-imports */
const OSCReq = require("osc") as any;

const VRChatReceiverPort = 9001;
const VRChatSenderPort = 9000;

function isInt(n: any) {
  return Number(n) === n && n % 1 === 0;
}

function isFloat(n: any) {
  return Number(n) === n && n % 1 !== 0;
}

export type OSCMessage = {
  address: string;
  args: any[];
}

export class OSC {
  port: any;
  avatar = new Avatar(this);
  chatbox = new Chatbox(this);
  constructor(public api: VRCKitAPI) { }

  async init() {
    this.port = new OSCReq.UDPPort({
      localAddress: "127.0.0.1",
      localPort: VRChatReceiverPort,
      remoteAddress: "127.0.0.1",
      remotePort: VRChatSenderPort,
    });

    this.port.once("ready", () => {
      this.api.logger.info("OSC", "Connection opened.");
    });

    this.port.on("message", this.handleMessage.bind(this));

    this.port.open();

    await this.avatar.init();
  }

  async destroy() {
    this.avatar.destroy();
    this.port.removeAllListeners();
    this.port.close();
    this.port = null;
  }

  async handleMessage(message: OSCMessage) {
    switch (message.address) {
      case "/avatar/change": {
        const avatarId = message.args[0];
        this.api.events.emit("AvatarSelected", { id: avatarId, from: "OSC" });
        break;
      }
    }

    this.api.events.emit("OSCMessage", message);
  }

  send(address: string, ...args: any[]) {
    if (!this.port) return;
    this.port.send({
      address,
      args: args.map(arg => {
        if (arg === null || arg === undefined) return { type: "N", value: 0 };
        const jsType = typeof arg;
        if (jsType === "number" && isInt(arg)) return { type: "i", value: arg };
        if (jsType === "number" && isFloat(arg)) return { type: "f", value: arg };
        if (jsType === "string") return { type: "s", value: arg };
        if (jsType === "boolean") return { type: arg ? "T" : "F", value: arg };
      })
    });
  }
}