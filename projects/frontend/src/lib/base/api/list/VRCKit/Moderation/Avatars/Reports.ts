import type { Avatars } from ".";

export type AvatarReport = {
  id: string;
  created_at: Date;
  user_id: string;
  avatar_id: string;
  title: string;
  reason: string;
  user: {
    display_name: string;
    selected_avatar_id: string;
  }
};

export class Reports {
  constructor(public avatars: Avatars) { }

  async search(search: string, skip: number, take: number) {
    const res = await this.avatars.moderation.vrckit.fetch({
      method: "GET",
      url: `/moderation/avatars/reports?query=${encodeURIComponent(search)}&skip=${skip}&take=${take}`,
    });

    return res.data as {
      total_count: number;
      avatar_reports: AvatarReport[];
    };
  }

  async delete(userId: string) {
    const res = await this.avatars.moderation.vrckit.fetch({
      method: "DELETE",
      url: `/moderation/avatars/reports/${userId}`,
    });
    return res.status === 200;
  }
}