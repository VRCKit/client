/* eslint-disable @typescript-eslint/no-require-imports */
const chokidar = require("chokidar") as typeof import("chokidar");
const path = require("path") as typeof import("path");
const lineReader = require("line-reader") as typeof import("line-reader");
const process = require("process") as typeof import("process");

import PQueue from 'p-queue';
import type { Systems } from ".";
import type { DatabaseAvatar } from '../Database/Avatars';
import randomInteger from 'stuffs/lib/randomInteger';

const validPlatforms = ["standalonewindows", "android", "ios"];
const platformMap = {
  "standalonewindows": "StandaloneWindows",
  "android": "Android",
  "ios": "IOS",
};

// const OneDay = 1000 * 60 * 60 * 24;

export class CacheScannerSystem {
  watcher: import("chokidar").FSWatcher | null = null;
  queue: PQueue | null = null;
  constructor(public systems: Systems) { }

  async init() {
    const amplitudeCachePath = await this.systems.api.config.get(
      "VRChatAmplitudeCachePath",
      path.join(process.env.APPDATA as string, "../VRChat/VRChat/amplitude.cache")
    );

    const logsPath = path.join(process.env.APPDATA as string, "../LocalLow/VRChat/VRChat");

    this.systems.api.logger.info("CacheScanner", `Starting cache scanner.`);
    this.queue = new PQueue({ concurrency: 1 });

    const AvatarIdRegex = this.systems.api.constants.AvatarIdRegex;

    this.watcher = chokidar.watch([
      amplitudeCachePath!,
      logsPath
    ], {
      ignoreInitial: true,
      depth: 1
    });
    this.watcher.on("all", async (event, path) => {
      if (event !== "add" && event !== "change") return;

      if (!(await this.systems.api.vrchat.auth.isLoggedIn())) return;

      lineReader.eachLine(path, { bufferSize: 1024 }, async (line, last, continueCb) => {
        for (const match of line.matchAll(AvatarIdRegex)) {
          const avatarId = match[0];
          this.queue?.add(async () => {
            await this.handleNewAvatar(avatarId);
            await new Promise(resolve => setTimeout(resolve, randomInteger(100, 500)));
          });
        }

        continueCb?.();
      });
    });
  }

  async destroy() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    if (this.queue) {
      await this.queue.onIdle();
      this.queue.clear();
      this.queue = null;
    }
  }

  async handleNewAvatar(avatarId: string, forceFetch = false, skipCache = false) {
    const isExists = skipCache ? false : await this.systems.api.database.avatars.has(avatarId);
    if (!isExists || forceFetch) {
      const fetched = await this.systems.api.vrchat.avatars.fetch(avatarId);
      if (fetched?.unity_packages) {
        const platforms = new Map<string, { platform: string, performance: string }>();

        fetched.unity_packages.forEach(pkg => {
          if (pkg.platform && validPlatforms.includes(pkg.platform) && pkg.performanceRating) {
            const mappedPlatform = platformMap[pkg.platform as keyof typeof platformMap];
            platforms.set(mappedPlatform, {
              platform: mappedPlatform,
              performance: pkg.performanceRating || "None",
            });
          }
        });

        const avatar = skipCache ? null : await this.systems.api.database.avatars.get(avatarId);

        const data = {
          id: avatarId,
          name: fetched.name,
          author_id: fetched.author_id,
          author_name: fetched.author_name,
          image_url: fetched.image_url,
          description: fetched.description,
          tags: fetched.tags.join(", "),
          avatar_created_at: fetched.created_at,
          avatar_updated_at: fetched.updated_at,
          updated_at: new Date().toISOString(),
          created_at: avatar?.created_at ?? new Date().toISOString(),
          platforms: [...platforms.values()].map(p => `${p.platform}: ${p.performance}`).join(", ").trim(),
        }

        if (!skipCache) await this.systems.api.database.avatars.put(data);
        const totalCount = await this.systems.api.database.avatars.count();
        this.systems.api.logger.info("CacheScanner", `Added new avatar: ${avatarId}! Total avatars: ${totalCount}`);
        if (!forceFetch) this.systems.api.events.emit("CacheScanner;NewAvatar", data);
        await this.putAvatarToServerDirectly(data);
      }
    }
  }

  async putAvatarToServerDirectly(avatar: Omit<DatabaseAvatar, "idx">) {
    const imgReq = await this.systems.api.vrchat.fetch({
      method: "HEAD",
      url: avatar.image_url
    });

    await this.systems.api.vrckit.avatars.put({
      id: avatar.id,
      author_id: avatar.author_id,
      author_name: avatar.author_name,
      image_file_url: imgReq.url,
      name: avatar.name,
      description: avatar.description,
      tags: avatar.tags,
      avatar_created_at: avatar.avatar_created_at,
      avatar_updated_at: avatar.avatar_updated_at,
      platforms: avatar.platforms,
    });

    this.systems.api.logger.info("CacheScanner", `Sent avatar to server: ${avatar.id}`);
    return true;
  }

  async putAvatarToServer(avatarId: string) {
    const avatar = await this.systems.api.database.avatars.get(avatarId);
    if (!avatar) return false;

    await this.putAvatarToServerDirectly(avatar);
    return true;
  }
}