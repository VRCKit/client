/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Moderation } from ".";

export type Audit = {
  id: string;
  created_at: Date;
  type: string;
  data: any;
  order_id: number;
  user_id: string | null;
  user?: {
    display_name: string;
    selected_avatar_id: string;
  }
};

export class Audits {
  constructor(public moderation: Moderation) { }

  async search(types: string[], userId: string | null, skip: number, take: number) {
    const res = await this.moderation.vrckit.fetch({
      method: "GET",
      url: `/moderation/audits?types=${encodeURIComponent(types.join(","))}&user_id=${userId || ""}&skip=${skip}&take=${take}`,
    });

    return res.data as {
      total_count: number;
      audits: Audit[];
    };
  }

  async types() {
    const res = await this.moderation.vrckit.fetch({
      method: "GET",
      url: `/moderation/audits/types`,
    });
    return res.data as string[];
  }
}