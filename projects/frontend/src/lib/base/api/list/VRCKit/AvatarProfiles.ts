import type { VRCKit } from ".";
import type { Avatar } from "./Avatars";

export type AvatarProfile = {
  id: string;
  avatar_id: string;
  parameters?: Record<string, number | boolean>;
  name: string;
  visibility: "Public" | "Private";
  created_at: string;
  updated_at: string;
  author_id: string;
  author: {
    display_name: string;
  };
  avatar?: Avatar;
}

export class AvatarProfiles {
  constructor(public vrckit: VRCKit) { }

  async search(search: string, skip: number, take: number, onlyPrivate: boolean = false, includeAvatar: boolean = false) {
    const req = await this.vrckit.fetch({
      url: `/profiles/avatars?query=${encodeURIComponent(search)}&skip=${skip}&take=${take}&only_private=${onlyPrivate}&include_avatar=${includeAvatar}`
    });

    return req.data as {
      total_count: number;
      profiles: AvatarProfile[];
    }
  }

  async fetch(id: string) {
    const req = await this.vrckit.fetch({
      url: `/profiles/avatars/${id}`
    });

    return req.data as AvatarProfile;
  }

  async put(data: { name: string, parameters: Record<string, number | boolean>, visibility: "Public" | "Private", avatar_id: string }) {
    const req = await this.vrckit.fetch({
      method: "PUT",
      url: `/profiles/avatars`,
      data
    });

    return req.status === 200;
  }

  async delete(id: string) {
    const req = await this.vrckit.fetch({
      method: "DELETE",
      url: `/profiles/avatars/${id}`
    });

    return req.status === 200;
  }
}