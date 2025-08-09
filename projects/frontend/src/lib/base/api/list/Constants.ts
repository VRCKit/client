import type { VRCKitAPI } from "../VRCKitAPI";
export class Constants {
  AvatarIdRegex = /avtr_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/g;
  UserIdRegex = /usr_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/g;
  VRCKitApiBaseUrl = "https://api.vrckit.com";
  VRChatApiBaseUrl = "https://vrchat.com/api/1";
  VRChatPipelineUrl = "wss://pipeline.vrchat.cloud"
  ChatboxUpdateDelay = 2250;
  WebVersion = "0.3.5-dev.0";
  LatestLegalDate = "08.08.2025";
  constructor(public api: VRCKitAPI) { }
}
