import type { VRCKitAPI } from "../VRCKitAPI";
import { goto } from "$app/navigation";
import { translate } from "$lib/other/googletrans/googletrans";
export class Utils {
  currentAvatarId: string | null = null;
  translate = translate;

  constructor(public api: VRCKitAPI) {

  }

  uppercaseFirstLetters(t: string) {
    return t.replace(/(?:(?::)\S)|(\d+\S)|(?:(?:^|\s)\S)/g, (a) => a.toUpperCase());
  }

  formatTagName(tag: string) {
    return this.uppercaseFirstLetters(tag.replace(/_/g, " "));
  }

  async selectAvatar(avatarId: string, awaitOSC = false) {
    this.api.toast.info("Selecting avatar...");

    try {
      await this.api.vrchat.avatars.select(avatarId);
      await this.api.vrckit.users.current.patch({ selected_avatar_id: avatarId });
      this.api.events.emit("AvatarSelected", { id: avatarId, from: "VRCKit" });
      if (awaitOSC) {
        const success = await new Promise(r => {
          this.api.events.filteredOnce(
            'AvatarSelected',
            ({ from }) => {
              if (from === 'OSC') {
                r(true);
                return true;
              }
              return false;
            },
            30000,
            () => r(false)
          )
        });
        if (!success) {
          this.api.toast.error("Failed to select avatar", {
            description: "Failed to get confirmation from OSC. Are you sure you have OSC enabled or game actually running?"
          });
          return false;
        }
      }
      return true;
    } catch (error) {
      this.api.toast.error("Failed to select avatar", {
        description: `${error}`
      });
      return false;
    }
  }

  async selectAvatarProfile(profileId: string) {
    const profile = await this.api.vrckit.avatarProfiles.fetch(profileId);
    const parameters = profile.parameters!;
    return await this.api.osc.avatar.loadParameters(parameters, profile.avatar_id);
  }

  async selectChatboxProfile(profileId: string) {
    const profile = await this.api.vrckit.chatboxProfiles.fetch(profileId);
    const config = profile.config || { template: "", modules: {}, egg: false, trim_template: true };
    this.api.chatbox.setConfig({
      template: config.template,
      egg: config.egg,
      trimTemplate: config.trim_template,
      autoTemplateUpdateCondition: config.auto_template_update_condition,
    });
    this.api.chatbox.modules.setAllInputValues(config.modules as Record<string, unknown>);
    this.api.toast.success("Chatbox profile loaded.", {
      duration: 3000,
      description: `Loaded chatbox profile ${profile.name} by ${profile.author.display_name}.`,
    });
  }

  avatarImageURL(id: string | null) {
    if (!id) return null;
    return `${this.api.constants.VRCKitApiBaseUrl}/files/avatar_images/${id}/image.webp`;
  }

  async copyText(text: string) {
    await navigator.clipboard.writeText(text);
    this.api.toast.success("Text copied to clipboard.", { duration: 3000, description: text });
  }

  private async handleAvatarSelected({ id, from }: { id: string, from: "OSC" | "VRCKit" | "VRChat" }) {
    this.currentAvatarId = id;

    await this.api.systems.cacheScanner.handleNewAvatar(id);
    try {
      const avatar = await this.api.vrckit.avatars.fetch(id);
      if (!avatar) throw new Error("Failed to fetch avatar data");
      this.api.toast.success(`Avatar selected`, { duration: 3000, description: `Avatar ${avatar.name} by ${avatar.author_name} successfully selected. Got update from ${from}.` });

      if (from === "OSC") await this.api.vrckit.users.current.patch({ selected_avatar_id: id });
      this.api.events.emit("AvatarSelectSuccess", { id });
    } catch {
      this.api.toast.error("Failed to fetch avatar data");
    }
  }

  handleDeepLink(_: unknown, arg: string) {
    try {
      const json = JSON.parse(arg);
      if (!Array.isArray(json)) throw new Error("Invalid deep link format");
      json.forEach(async (item) => {
        switch (item.type) {
          case "SelectAvatar": {
            if (!item.id) throw new Error("SelectAvatar deep link missing id");
            this.selectAvatar(item.id)
            break;
          }
          case "AvatarLibrarySearch": {
            if (!item.query) throw new Error("AvatarLibrarySearch deep link missing query");
            await goto("/");
            goto(`/avatars/library?${new URLSearchParams({
              query: item.query,
              query_engine: item.query_engine,
              page: item.page,
            }).toString()}`);
            break;
          }
          case "PatreonCallback": {
            if (!item.user_id || !item.patreon_user_id || !item.patreon_email) {
              throw new Error("PatreonCallback deep link missing required fields");
            }
            const currentUser = await this.api.vrckit.users.current.fetch();
            if (currentUser.id !== item.user_id) throw new Error("PatreonCallback deep link user_id does not match current user");

            this.api.toast.success("Patreon account linked successfully", {
              duration: 10000,
              description: `You can now access Patreon features in VRCKit. Patreon user ID: ${item.patreon_user_id}, Email: ${item.patreon_email}`,
            });

            await goto("/");
            await new Promise((resolve) => setTimeout(resolve, 1));
            goto(`/profile`);
            break;
          }
          case "AuthorizationPage": {
            if (!item.cfg) throw new Error("AuthorizationPage deep link missing cfg");

            await goto("/");
            goto(`/authorization?${new URLSearchParams({
              cfg: JSON.stringify(item.cfg),
            }).toString()}`);
          }
        }
      });
    } catch (e: unknown) {
      this.api.logger.error("DeepLink", e);
      this.api.toast.error("Failed to parse deep link", {
        description: `${e}`,
        duration: 5000,
      });
      return;
    }
  }

  init() {
    this.api.ipcRenderer.on("DeepLink", this.handleDeepLink.bind(this));
    this.api.events.on("AvatarSelected", this.handleAvatarSelected.bind(this));
    setTimeout(() => {
      this.api.vrckit.users.current.fetch().then((user) => {
        if (this.currentAvatarId !== user.selected_avatar_id) {
          this.api.events.emit("AvatarSelected", { id: user.selected_avatar_id, from: "VRCKit" });
        }
      });
    }, 1000);
  }

  destroy() {
    this.api.ipcRenderer.off("DeepLink", this.handleDeepLink.bind(this));
    this.api.events.off("AvatarSelected", this.handleAvatarSelected.bind(this));
  }
}