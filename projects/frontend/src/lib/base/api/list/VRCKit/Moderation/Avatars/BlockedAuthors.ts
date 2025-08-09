import type { Avatars } from ".";

export type BlockedAvatarAuthor = {
  id: string;
  reason: string;
  created_at: Date;
};

export class BlockedAuthors {
  constructor(public avatars: Avatars) { }

  async search(search: string, skip: number, take: number) {
    const res = await this.avatars.moderation.vrckit.fetch({
      method: "GET",
      url: `/moderation/avatars/blocked/authors?query=${encodeURIComponent(search)}&skip=${skip}&take=${take}`,
    });

    return res.data as {
      total_count: number;
      blocked_avatar_authors: BlockedAvatarAuthor[];
    };
  }

  async put(
    authorId: string,
    reason: string
  ) {
    const res = await this.avatars.moderation.vrckit.fetch({
      method: "PUT",
      url: `/moderation/avatars/blocked/authors`,
      data: {
        id: authorId,
        reason,
      },
    });
    return res.data;
  }

  async delete(authorId: string) {
    const res = await this.avatars.moderation.vrckit.fetch({
      method: "DELETE",
      url: `/moderation/avatars/blocked/authors/${authorId}`,
    });
    return res.status === 200;
  }
}