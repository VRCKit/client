import type { Current } from ".";
import type { Avatar } from "../../Avatars";

export class AvatarHistory {
  constructor(public current: Current) { }

  async search(query: string, skip: number, take: number, queryEngine: "basic" | "complex" = "basic") {
    const res = await this.current.users.vrckit.fetch({
      method: "GET",
      url: `/users/@me/history/avatars?query=${encodeURIComponent(query)}&query_engine=${queryEngine}&skip=${skip}&take=${take}`,
    });
    return res.data as {
      total_count: number;
      avatars: {
        id: string;
        avatar: Avatar;
        created_at: string;
      }[];
    };
  }

  async delete(id: string) {
    const res = await this.current.users.vrckit.fetch({
      method: "DELETE",
      url: `/users/@me/history/avatars/${id}`,
    });
    return res.status === 200;
  }
}