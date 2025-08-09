import type { VRChat } from ".";

const OneMinute = 1000 * 60;

export class Users {
  currentUser: Record<string, unknown> | null = null;

  get currentUserId() {
    return this.currentUser?.id as string || null;
  }

  constructor(public vrchat: VRChat) { }

  async init() {
    this.vrchat.api.database.keyValues.clear((kv) => (kv.key.startsWith("VRChat;UserCache;") && (Date.now() - kv.value.at) > OneMinute));

    if ((await this.vrchat.api.vrckit.auth.isLoggedIn()) && (await this.vrchat.api.vrckit.auth.isLoggedIn())) {
      const currentUserCached = await this.vrchat.api.database.keyValues.get<{ id: string }>(`VRChat;CurrentUser`) || null;
      if (currentUserCached) this.currentUser = currentUserCached;
      const at = (await this.vrchat.api.database.keyValues.get<number>(`VRChat;LastCurrentUserFetchAt`, 0))!;
      if ((Date.now() - at) > OneMinute) {
        await this.vrchat.api.database.keyValues.set(`VRChat;LastCurrentUserFetchAt`, Date.now());
        const currentUser = await this.fetchCurrent();
        await this.vrchat.api.database.keyValues.set(`VRChat;CurrentUser`, currentUser);
        this.currentUser = currentUser;
        await this.vrchat.api.vrckit.users.current.patch({
          selected_avatar_id: currentUser.currentAvatar,
        });
        this.vrchat.api.events.emit("AvatarSelected", { id: currentUser.currentAvatar, from: "VRChat" });
        this.vrchat.api.logger.info("VRChat", `Fetched current user: ${currentUser.displayName} (${currentUser.id})`);
      }
      this.vrchat.api.events.emit("VRChatCurrentUser", this.currentUser);
    }
  }

  async destroy() { }

  async fetchCurrent() {
    const cookies = await this.vrchat.auth.getAuthCookies();
    if (!cookies) throw new Error("Not logged in");
    const res = await this.vrchat.fetch({
      method: "GET",
      url: "/auth/user",
      responseType: "json"
    });
    if (res.status === 401 || res.status === 403) {
      this.vrchat.api.logger.error("VRChat", `Failed to fetch current user: ${JSON.stringify(res.data)}`);
      await this.vrchat.auth.logout();
      window.location.href = "/";
      throw new Error(`Failed to fetch current user: ${JSON.stringify(res.data)}`);
    }
    await this.vrchat.api.database.keyValues.set(`VRChat;CurrentUser`, res.data);
    this.currentUser = res.data;
    return res.data;
  }

  async fetch(userId: string) {
    const cookies = await await this.vrchat.auth.getAuthCookies();
    if (!cookies) throw new Error("Not logged in");

    const cached = (await this.vrchat.api.database.keyValues.get(`VRChat;UserCache;${userId}`)) as { data: unknown, at: number } | null;
    if (!cached || (Date.now() - cached.at) > OneMinute) {
      const res = await this.vrchat.fetch({
        method: "GET",
        url: `/users/${userId}`,
        responseType: "json"
      });
      if (res.status !== 200) throw new Error(`Failed to fetch user: ${JSON.stringify(res.data)}`);
      await this.vrchat.api.database.keyValues.set(`VRChat;UserCache;${userId}`, { data: res.data, at: Date.now() });
      return res.data;
    }

    return cached.data;
  }

}