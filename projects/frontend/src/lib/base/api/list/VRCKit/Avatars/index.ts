import type { VRCKit } from "..";

export type Avatar = {
  id: string;
  author_id: string;
  author_name: string;
  name: string;
  description: string;
  tags: string;
  user_tags: string;
  ai_tags: string;
  ai_tags_v2: string;
  avatar_created_at: string;
  avatar_updated_at: string;
  created_at: string;
  updated_at: string;
  uploader_id: string;
  platforms: string;
  favorite_count: number;
  selected_count: number;
  comment_count: number;
}

type AvatarDataToPut = {
  id: string;
  author_id: string;
  author_name: string;
  image_file_url: string;
  name: string;
  description: string;
  tags: string;
  avatar_created_at: string;
  avatar_updated_at: string;
  platforms: string;
}

export class Avatars {
  constructor(public vrckit: VRCKit) { }

  async put(data: AvatarDataToPut) {
    const req = await this.vrckit.fetch({
      method: "PUT",
      url: "/avatars",
      data,
    });
    return req.data;
  }

  async fetch(id: string) {
    const req = await this.vrckit.fetch({
      method: "GET",
      url: `/avatars/${id}`,
    });
    return req.data as Avatar;
  }

  async delete(id: string, block: boolean = false) {
    const req = await this.vrckit.fetch({
      method: "DELETE",
      url: `/avatars/${id}`,
      data: { block },
    });
    return req.status === 200;
  }

  async patch(id: string, data: { user_tags?: string }) {
    const res = await this.vrckit.fetch({
      method: "PATCH",
      url: `/avatars/${id}`,
      data,
    });
    return res.status === 200;
  }

  async search(search: string, skip: number, take: number, queryEngine: "basic" | "complex" | "redis" = "basic", sortKey: string = "created_at", sortDir: "asc" | "desc" = "desc", force: boolean = false) {
    const req = await this.vrckit.fetch({
      method: "GET",
      url: `/avatars?query=${encodeURIComponent(search)}&query_engine=${queryEngine}&skip=${skip}&take=${take}&sort=${sortKey}:${sortDir}&force=${force}`,
    });
    return req.data as {
      avatars: Avatar[];
      total_count: number;
    };
  }

  async report(id: string, title: string, reason: string) {
    const req = await this.vrckit.fetch({
      method: "PUT",
      url: `/avatars/${id}/reports`,
      data: {
        title,
        reason,
      },
    });
    return req.status === 200;
  }
}