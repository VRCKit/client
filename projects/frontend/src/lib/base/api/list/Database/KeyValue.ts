/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Database } from ".";

export interface DatabaseKeyValue {
  key: string;
  value: any;
}

export class DatabaseKeyValues {
  constructor(public database: Database) { }

  async get<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    const res = (await this.database.dexie.keyValue.get(key))?.value ?? null;
    if (res === null && defaultValue !== null) {
      await this.set(key, defaultValue);
      return defaultValue;
    }
    return res;
  }

  async set(key: string, value: any) {
    await this.database.dexie.keyValue.put({ key, value }, key);
  }

  async update(key: string, cb: (value: any) => any) {
    const entry = await this.get<any>(key);
    await this.set(key, await cb(entry));
  }

  async clear(filter: (kv: DatabaseKeyValue) => boolean = () => true) {
    await this.database.dexie.keyValue.filter(filter).delete();
  }
}