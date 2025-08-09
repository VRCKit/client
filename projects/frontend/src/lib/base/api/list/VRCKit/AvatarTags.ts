import type { VRCKit } from ".";

export type AvatarTag = {
  tag: string;
  count: number;
}

export class AvatarTags {
  constructor(public vrckit: VRCKit) { }

  async search(search: string, skip: number, take: number) {
    const req = await this.vrckit.fetch({
      url: `/tags/avatars?query=${encodeURIComponent(search)}&skip=${skip}&take=${take}`
    });

    return req.data as {
      total_count: number;
      tags: AvatarTag[];
    }
  }

  async extract(text: string) {
    const req = await this.vrckit.fetch({
      url: `/tags/avatars/extract?text=${encodeURIComponent(text)}`
    });

    return req.data.tags as AvatarTag[];
  }

  async popular(skip: number, take: number) {
    const req = await this.vrckit.fetch({
      url: `/tags/avatars/popular?skip=${skip}&take=${take}`
    });

    return req.data as {
      total_count: number;
      tags: AvatarTag[];
    }
  }
}