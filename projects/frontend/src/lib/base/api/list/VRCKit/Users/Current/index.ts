import type { Users } from "..";
import { AvatarCollections } from "./AvatarCollections";
import { AvatarHistory } from "./AvatarHistory";
import { FavoriteAvatars } from "./FavoriteAvatars";

export type CurrentUser = {
  id: string;
  email: string;
  display_name: string;
  system_flags: string[];
  selected_avatar_id: string | null;
  created_at: string;
  discord_user_id: string | null;
  discord_referenced_user_id: string | null;
  patreon_user_id: string | null;
  patreon_email: string | null;
}

export class Current {
  favoriteAvatars = new FavoriteAvatars(this);
  avatarHistory = new AvatarHistory(this);
  avatarCollections = new AvatarCollections(this);
  _user: CurrentUser | null = null;
  _userAt = 0;

  constructor(public users: Users) { }

  async keepAlive() {
    await this.users.vrckit.fetch({
      method: "POST",
      url: "/users/@me/keep-alive",
    });
  }

  async fetch(): Promise<CurrentUser> {
    const res = await this.users.vrckit.fetch({
      method: "GET",
      url: "/users/@me",
    });

    return res.data;
  }

  async isPremium(...otherFlags: string[]): Promise<boolean> {
    if (!this._user || Date.now() - this._userAt > 60000 * 60) {
      this._user = await this.fetch();
      this._userAt = Date.now();
    }
    return [
      'PremiumTier1',
      'PremiumTier2',
      'PremiumTier3',
      ...otherFlags
    ].some((i) => this._user!.system_flags.includes(i));
  }

  async patch(data: { selected_avatar_id?: string | null, display_name?: string }) {
    const res = await this.users.vrckit.fetch({
      method: "PATCH",
      url: "/users/@me",
      data,
    });
    return res.data as {
      success: boolean;
      error?: string;
    }
  }
}