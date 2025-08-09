import type { VRCKit } from "..";
import { Items } from "./Items";

export type AvatarCollection = {
  id: string;
  name: string;
  description: string;
  tags: string;
  image_avatar_id: string | null;
  visibility: "Public" | "Private";
  created_at: string;
  updated_at: string;
  author_id: string;
  like_count: number;
  avatar_count: number;
  author: {
    display_name: string;
  }
}

export class AvatarCollections {
  items = new Items(this);

  constructor(public vrckit: VRCKit) { }

  async search(search: string, skip: number, take: number, onlyPrivate: boolean = false, sortKey: string = "created_at", sortDir: "asc" | "desc" = "desc") {
    const req = await this.vrckit.fetch({
      method: "GET",
      url: `/collections/avatars?query=${encodeURIComponent(search)}&skip=${skip}&take=${take}&only_private=${onlyPrivate}&sort=${sortKey}:${sortDir}`
    });

    return req.data as {
      total_count: number;
      collections: AvatarCollection[];
    }
  }

  async fetch(id: string) {
    const req = await this.vrckit.fetch({
      method: "GET",
      url: `/collections/avatars/${id}`
    });

    return req.data as AvatarCollection;
  }

  async patch(collectionId: string, data: Partial<{ name: string, description: string, tags: string, visibility: "Public" | "Private", image_avatar_id: string | null }> = {}) {
    const req = await this.vrckit.fetch({
      method: "PATCH",
      url: `/collections/avatars/${collectionId}`,
      data
    });

    return req.status === 200;
  }

  async put(data: { name: string, description: string, tags: string, visibility: "Public" | "Private" }) {
    const req = await this.vrckit.fetch({
      method: "PUT",
      url: `/collections/avatars`,
      data
    });

    if (req.status !== 200) throw new Error(JSON.stringify(req.data));

    return req.data as AvatarCollection;
  }

  async delete(id: string) {
    const req = await this.vrckit.fetch({
      method: "DELETE",
      url: `/collections/avatars/${id}`
    });

    return req.status === 200;
  }
}