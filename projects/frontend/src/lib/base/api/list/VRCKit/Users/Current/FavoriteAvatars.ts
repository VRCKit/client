import type { Current } from ".";
import type { Avatar } from "../../Avatars";

export class FavoriteAvatars {
  constructor(public current: Current) { }

  async search(query: string, skip: number, take: number, queryEngine: "basic" | "complex" = "basic") {
    const res = await this.current.users.vrckit.fetch({
      method: "GET",
      url: `/users/@me/favorites/avatars?query=${encodeURIComponent(query)}&query_engine=${queryEngine}&skip=${skip}&take=${take}`,
    });
    return res.data as {
      total_count: number;
      max_limit: number;
      avatars: {
        avatar: Avatar;
        created_at: string;
        estimated_order_id: number;
        custom_order_id: number;
      }[];
    };
  }

  async fetch(id: string) {
    const res = await this.current.users.vrckit.fetch({
      method: "GET",
      url: `/users/@me/favorites/avatars/${id}`,
    });
    return res.data as ({
      favorited: boolean;
      created_at?: string;
    })
  }

  async put(id: string) {
    const res = await this.current.users.vrckit.fetch({
      method: "PUT",
      url: `/users/@me/favorites/avatars`,
      data: { id },
    });
    return res.status === 200;
  }

  async delete(id: string) {
    const res = await this.current.users.vrckit.fetch({
      method: "DELETE",
      url: `/users/@me/favorites/avatars/${id}`,
    });
    return res.status === 200;
  }

  async patch(id: string, obj: {
    custom_order_id?: number;
  }) {
    const res = await this.current.users.vrckit.fetch({
      method: "PATCH",
      url: `/users/@me/favorites/avatars/${id}`,
      data: obj,
    });
    return res.status === 200;
  }

  async move(id: string, direction: "Up" | "Down", value: number = 1) {
    const res = await this.current.users.vrckit.fetch({
      method: "POST",
      url: `/users/@me/favorites/avatars/${id}/move`,
      data: { direction, value },
    });
    return res.status === 200;
  }
}