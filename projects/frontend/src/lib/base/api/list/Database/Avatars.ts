import type { Database } from ".";

export interface DatabaseAvatar {
  id: string;
  name: string;
  author_id: string;
  author_name: string;
  image_url: string;
  description: string;
  tags: string;
  platforms: string;
  avatar_created_at: string;
  avatar_updated_at: string;
  created_at: string;
  updated_at: string;
  idx: number;
}

export class DatabaseAvatars {
  constructor(public database: Database) { }

  private _filtered(query: string) {
    const queryLower = query.toLowerCase();
    const reversed = this.database.dexie.avatars.orderBy("idx").reverse();
    if (!query) return reversed;
    return reversed.filter((a) => {
      return !queryLower || a.id === query
        || a.author_id === query
        || a.name.toLowerCase().includes(queryLower)
        || a.tags.toLowerCase().includes(queryLower)
        || a.author_name.toLowerCase().includes(queryLower)
        || a.description.toLowerCase().includes(queryLower);
    });
  }

  async count(query: string = ""): Promise<number> {
    return await this._filtered(query).count();
  }

  async has(id: string): Promise<boolean> {
    return !!(await this.database.dexie.avatars.where("id").equals(id).count());
  }

  async get(id: string): Promise<DatabaseAvatar | null> {
    return (await this.database.dexie.avatars.get(id)) || null;
  }

  async search(query: string, skip: number = 0, limit: number = 50): Promise<DatabaseAvatar[]> {
    return (await this._filtered(query).toArray()).sort((a, b) => b.idx - a.idx).slice(skip, skip + limit);
  }

  async getAll(skip: number = 0, limit: number = 50): Promise<DatabaseAvatar[]> {
    return (await this.database.dexie.avatars.toArray()).sort((a, b) => b.idx - a.idx).slice(skip, skip + limit);
  }

  async clear() {
    await this.database.dexie.avatars.clear();
  }

  async put(avatar: Omit<DatabaseAvatar, "idx">) {
    const idx = (await this.get(avatar.id))?.idx ?? ((await this.count()) + 1);
    await this.database.dexie.avatars.put({
      ...avatar,
      idx
    }, avatar.id);
  }
}