import type { VRCKit } from ".";

export type ChatboxProfile = {
  id: string;
  author_id: string;
  author: {
    display_name: string;
  }
  name: string;
  visibility: "Public" | "Private";
  preview: string;
  config?: {
    template: string;
    trim_template: boolean;
    egg: boolean;
    auto_template_update_condition?: string;
    modules: unknown;
  };
  created_at: string;
  updated_at: string;
}

export class ChatboxProfiles {
  constructor(public vrckit: VRCKit) { }

  async search(search: string, skip: number, take: number, onlyPrivate: boolean = false) {
    const req = await this.vrckit.fetch({
      url: `/chatbox/profiles?query=${encodeURIComponent(search)}&skip=${skip}&take=${take}&only_private=${onlyPrivate}`
    });

    return req.data as {
      total_count: number;
      profiles: ChatboxProfile[];
    }
  }

  async fetch(id: string) {
    const req = await this.vrckit.fetch({
      url: `/chatbox/profiles/${id}`
    });

    return req.data as ChatboxProfile;
  }

  async delete(id: string) {
    const req = await this.vrckit.fetch({
      method: "DELETE",
      url: `/chatbox/profiles/${id}`
    });

    return req.status === 200;
  }

  async put(data: { name: string, preview: string, visibility: "Public" | "Private", config: ChatboxProfile["config"] }) {
    const req = await this.vrckit.fetch({
      method: "PUT",
      url: `/chatbox/profiles`,
      data
    });

    return req.status === 200;
  }
}