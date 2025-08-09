import type { VRCKitAPI } from "../../VRCKitAPI";
import { AvatarImporter } from "./AvatarImporter";
import { CacheScannerSystem } from "./CacheScanner";
import { SystemLayer } from "./SystemLayer";

export class Systems {
  cacheScanner = new CacheScannerSystem(this);
  systemLayer = new SystemLayer(this);
  avatarImporter = new AvatarImporter(this);
  constructor(public api: VRCKitAPI) { }

  async init() {
    await this.cacheScanner.init();
    await this.systemLayer.init();
    this.avatarImporter.init();
  }

  async destroy() {
    await this.cacheScanner.destroy();
    await this.systemLayer.destroy();
    await this.avatarImporter.destroy();
  }
}