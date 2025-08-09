import type { Avatars } from ".";

export type BlockedAvatar = {
  name: string;
  id: string;
  created_at: Date;
  author_id: string;
  author_name: string;
  reason: string;
};

export class Blocked {
  constructor(public avatars: Avatars) { }

  async search(search: string, skip: number, take: number) {
    const res = await this.avatars.moderation.vrckit.fetch({
      method: "GET",
      url: `/moderation/avatars/blocked?query=${encodeURIComponent(search)}&skip=${skip}&take=${take}`,
    });

    return res.data as {
      total_count: number;
      blocked_avatars: BlockedAvatar[];
    };
  }

  async put(
    id: string,
    name: string,
    author_id: string,
    author_name: string,
    reason: string
  ) {
    const res = await this.avatars.moderation.vrckit.fetch({
      method: "PUT",
      url: `/moderation/avatars/blocked`,
      data: {
        id,
        name,
        author_id,
        author_name,
        reason,
      },
    });
    return res.data;
  }

  async delete(userId: string) {
    const res = await this.avatars.moderation.vrckit.fetch({
      method: "DELETE",
      url: `/moderation/avatars/blocked/${userId}`,
    });
    return res.status === 200;
  }
}