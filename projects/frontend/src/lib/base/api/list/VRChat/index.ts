import type { VRCKitAPI } from "../../VRCKitAPI";
import type { HTTPResponse } from "../HTTP";
import { Auth } from "./Auth";
import { Avatars } from "./Avatars";
import { Pipeline } from "./Pipeline";
import { Users } from "./Users";

export class VRChat {
  userAgent: string | null = null;
  auth = new Auth(this);
  users = new Users(this);
  avatars = new Avatars(this);
  pipeline = new Pipeline(this);
  _init = false;
  constructor(public api: VRCKitAPI) {

  }

  async init() {
    if (this._init) return;
    this._init = true;
    this.userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 Edg/136.0.0.0 VRCKit/${this.api.constants.WebVersion} https://vrckit.com/`;
    await this.users.init();
    await this.pipeline.init();
  }

  async destroy() {
    this.userAgent = null;
    await this.users.destroy();
    await this.pipeline.destroy();
  }

  async fetch(reqData: import("axios").AxiosRequestConfig): Promise<HTTPResponse> {
    const cookies = await this.auth.getAuthCookies();
    if (!cookies) throw new Error("Not logged in");
    reqData.headers = {
      "User-Agent": this.userAgent,
      "Cookie": cookies,
      ...(reqData.headers || {})
    };
    if (!reqData.baseURL) reqData.baseURL = this.api.constants.VRChatApiBaseUrl;
    return this.api.http.fetch({
      ...reqData,
      side: "Server"
    });
  }
}