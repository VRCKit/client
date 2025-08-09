import type { Moderation } from ".";

export type ModerationUser = {
  id: string;
  display_name: string;
  selected_avatar_id: string;
  email: string;
  system_flags: string[];
  created_at: string;
  updated_at: string;
};

export class Users {
  constructor(public moderation: Moderation) { }

  async search(search: string, skip: number, take: number) {
    const res = await this.moderation.vrckit.fetch({
      method: "GET",
      url: `/moderation/users?query=${encodeURIComponent(search)}&skip=${skip}&take=${take}`,
    });

    return res.data as {
      total_count: number;
      online_count: number;
      users: ModerationUser[];
    };
  }

  async systemFlags() {
    const res = await this.moderation.vrckit.fetch({
      method: "GET",
      url: `/moderation/user/system-flags`,
    });
    return res.data as string[];
  }

  async delete(userId: string) {
    const res = await this.moderation.vrckit.fetch({
      method: "DELETE",
      url: `/moderation/users/${userId}`,
    });
    return res.data;
  }

  async putSystemFlag(userId: string, systemFlag: string) {
    const res = await this.moderation.vrckit.fetch({
      method: "PUT",
      url: `/moderation/users/${userId}/system-flags`,
      data: {
        flag: systemFlag,
      },
    });

    return res.data;
  }

  async deleteSystemFlag(userId: string, systemFlag: string) {
    const res = await this.moderation.vrckit.fetch({
      method: "DELETE",
      url: `/moderation/users/${userId}/system-flags/${systemFlag}`,
    });

    return res.data;
  }
}