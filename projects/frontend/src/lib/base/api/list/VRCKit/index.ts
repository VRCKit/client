import type { VRCKitAPI } from "../../VRCKitAPI";
import type { HTTPResponse } from "../HTTP";
import { Auth } from "./Auth";
import { Avatars } from "./Avatars";
import { AvatarCollections } from "./AvatarCollections";
import { Users } from "./Users";
import { AvatarProfiles } from "./AvatarProfiles";
import { ChatboxProfiles } from "./ChatboxProfiles";
import { Moderation } from "./Moderation";
import { Connections } from "./Connections";
import { AvatarTags } from "./AvatarTags";

export class VRCKit {
  auth = new Auth(this);
  avatars = new Avatars(this);
  users = new Users(this);
  avatarCollections = new AvatarCollections(this);
  avatarProfiles = new AvatarProfiles(this);
  chatboxProfiles = new ChatboxProfiles(this);
  moderation = new Moderation(this);
  connections = new Connections(this);
  avatarTags = new AvatarTags(this);

  constructor(public api: VRCKitAPI) { }

  async init() {
    await this.auth.init();
  }

  async destroy() {
    await this.auth.destroy();
  }

  async fetch(reqData: import("axios").AxiosRequestConfig): Promise<HTTPResponse> {
    const authToken = await this.auth.getAuthToken();
    if (!authToken) throw new Error("Not logged in");
    reqData.headers = {
      "Authorization": authToken,
      ...(reqData.headers || {})
    };
    if (!reqData.baseURL) reqData.baseURL = this.api.constants.VRCKitApiBaseUrl;
    return this.api.http.fetch({
      ...reqData,
      side: "Client"
    });
  }
}