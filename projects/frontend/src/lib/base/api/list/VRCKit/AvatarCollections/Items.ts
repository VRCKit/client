import type { AvatarCollections } from ".";
import type { Avatar } from "../Avatars";

export class Items {
  constructor(public collections: AvatarCollections) { }

  async search(collectionId: string, search: string, skip: number, take: number, queryEngine: "basic" | "complex") {
    const req = await this.collections.vrckit.fetch({
      method: "GET",
      url: `/collections/avatars/${collectionId}/items?query=${encodeURIComponent(search)}&query_engine=${queryEngine}&skip=${skip}&take=${take}`
    });

    return req.data as {
      total_count: number;
      max_limit: number;
      items: Avatar[];
    }
  }

  async put(collectionId: string, avatarId: string) {
    const req = await this.collections.vrckit.fetch({
      method: "PUT",
      url: `/collections/avatars/${collectionId}/items`,
      data: {
        id: avatarId
      }
    });

    return req.status === 200;
  }

  async delete(collectionId: string, avatarId: string) {
    const req = await this.collections.vrckit.fetch({
      method: "DELETE",
      url: `/collections/avatars/${collectionId}/items/${avatarId}`
    });

    return req.status === 200;
  }
}