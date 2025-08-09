import type { VRChat } from ".";

type ReleaseStatus = "public" | "private" | "hidden" | "all";

type AvatarUnityPackage = {
  assetVersion: number;
  created_at: string;
  id: string;
  performanceRating?: "None" | "Excellent" | "Good" | "Medium" | "Poor" | "VeryPoor";
  platform?: "standalonewindows" | "android" | "ios" | string;
  variant: string;
}

type AvatarResponse = {
  authorId: string;
  authorName: string;
  created_at: string;
  description: string;
  imageUrl: string;
  name: string;
  releaseStatus: ReleaseStatus;
  featured: boolean;
  tags: string[];
  thumbnailImageUrl: string;
  id: string;
  updated_at: string;
  version: number;
  unityPackages: AvatarUnityPackage[];
}

type AvatarResponseMapped = {
  author_id: string;
  author_name: string;
  created_at: string;
  description: string;
  image_url: string;
  name: string;
  release_status: ReleaseStatus;
  featured: boolean;
  tags: string[];
  thumbnail_image_url: string;
  id: string;
  updated_at: string;
  version: number;
  unity_packages: AvatarUnityPackage[];
}


export class Avatars {
  constructor(public vrchat: VRChat) { }

  async select(id: string) {
    const cookies = await this.vrchat.auth.getAuthCookies();
    if (!cookies) throw new Error("Not logged in");

    const res = await this.vrchat.fetch({
      method: "PUT",
      url: `/avatars/${id}/select`,
      responseType: "json"
    });

    if (res.status !== 200) {
      this.vrchat.api.logger.error("VRChat", `Failed to select avatar: ${JSON.stringify(res.data)}`);
      throw new Error(`Failed to select avatar: ${JSON.stringify(res.data)}`);
    }
  }

  async fetch(id: string) {
    const res = await this.vrchat.fetch({
      method: "GET",
      url: `/avatars/${id}`,
      responseType: "json"
    });

    if (res.status === 404) return null;

    const data: AvatarResponse = res.data;

    if (data?.releaseStatus !== "public") return null;

    return {
      author_id: data.authorId,
      author_name: data.authorName,
      created_at: data.created_at,
      description: data.description,
      image_url: data.imageUrl,
      name: data.name,
      release_status: data.releaseStatus,
      featured: data.featured,
      tags: data.tags,
      thumbnail_image_url: data.thumbnailImageUrl,
      id: data.id,
      updated_at: data.updated_at,
      version: data.version,
      unity_packages: data.unityPackages
    } as AvatarResponseMapped;
  }
}