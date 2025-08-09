/* eslint-disable @typescript-eslint/no-require-imports */
const { ipcRenderer, shell } = require("electron") as typeof import("electron");

import { toast } from "svelte-sonner";

import { Config } from "./list/Config";
import { Constants } from "./list/Constants";
import { Database } from "./list/Database";
import { HTTP } from "./list/HTTP";
import { Logger } from "./list/Logger";
import { Systems } from "./list/Systems";
import { VRChat } from "./list/VRChat";
import { OSC } from "./list/OSC";
import { VRCKit } from "./list/VRCKit";
import { BasicEventEmitter } from "./list/BasicEventEmitter";
import { Utils } from "./list/Utils";
import { Chatbox } from "./list/Chatbox";

export class VRCKitAPI {
  toast = toast;
  ipcRenderer = ipcRenderer;
  shell = shell;
  logger = new Logger(this);
  database = new Database(this);
  systems = new Systems(this);
  config = new Config(this);
  constants = new Constants(this);
  http = new HTTP(this);
  vrchat = new VRChat(this);
  vrckit = new VRCKit(this);
  utils = new Utils(this);
  osc = new OSC(this);
  chatbox = new Chatbox(this);
  events = new BasicEventEmitter();

  constructor() { }

  async init() {
    await this.config.init();
    await this.http.init();
    await this.utils.init();
    await this.database.init();
    await this.osc.init();
    await this.vrchat.init();
    await this.vrckit.init();
    await this.systems.init();
    await this.chatbox.init();
    this.logger.info("ClientAPI", "VRCKitAPI initialized.");
  }

  async destroy() {
    await this.database.destroy();
    await this.systems.destroy();
    await this.vrckit.destroy();
    await this.vrchat.destroy();
    await this.utils.destroy();
    await this.chatbox.destroy();
    await this.osc.destroy();
    await this.http.destroy();
    await this.config.destroy();
    this.logger.info("ClientAPI", "VRCKitAPI destroyed.");
  }
};