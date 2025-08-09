import type { Connections } from ".";

export class Patreon {
  constructor(public connections: Connections) { }

  async fetchUrl() {
    const res = await this.connections.vrckit.fetch({
      method: "GET",
      url: "/connections/patreon/url"
    });
    return res.data.url as string;
  }
}