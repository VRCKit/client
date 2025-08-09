import type { Current } from ".";
import type { AvatarCollection } from "../../AvatarCollections";

export class AvatarCollections {
  constructor(public current: Current) { }

  async fetch() {
    const res = await this.current.users.vrckit.fetch({
      method: "GET",
      url: `/users/@me/collections/avatars`,
    });

    return res.data as AvatarCollection[];
  }

  async fetchAvatar(avatarId: string) {
    const res = await this.current.users.vrckit.fetch({
      method: "GET",
      url: `/users/@me/collections/avatars/${avatarId}`,
    });

    return res.data as { contains: boolean; collection: AvatarCollection }[];
  }
}