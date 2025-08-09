import Dexie, { type EntityTable } from "dexie";
import type { VRCKitAPI } from "$lib/base/api/VRCKitAPI";
import { DatabaseAvatars, type DatabaseAvatar } from "./Avatars";
import { DatabaseKeyValues, type DatabaseKeyValue } from "./KeyValue";

type DexieType = Dexie & {
  avatars: EntityTable<DatabaseAvatar, "id">;
  keyValue: EntityTable<DatabaseKeyValue, "key">;
};

export class Database {
  dexie: DexieType;

  avatars = new DatabaseAvatars(this);
  keyValues = new DatabaseKeyValues(this);

  constructor(public api: VRCKitAPI) {
    this.dexie = (new Dexie("vrckit")) as DexieType;

    this.dexie.version(1).stores({
      avatars: "id, name, author_id, author_name, image_url, description, tags, platforms, avatar_created_at, avatar_updated_at, created_at, updated_at, idx",
      keyValue: "key"
    });
  }

  async init() {
    await this.dexie.open();
  }

  async destroy() {
    await this.dexie.close();
  }

  async clear() {
    await this.dexie.avatars.clear();
    await this.dexie.keyValue.clear();
  }
}
