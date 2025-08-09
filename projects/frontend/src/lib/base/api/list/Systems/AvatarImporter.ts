/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path") as typeof import("path");
const lineReader = require("line-reader") as typeof import("line-reader");

import type { Systems } from ".";
import PQueue from 'p-queue';

export class AvatarImporter {
  running = false;
  lastConfig: { filePath: string; concurrency: number, skipCache: boolean } | null = null;
  constructor(public systems: Systems) { }

  async init() { }

  async destroy() {
    this.running = false;
    this.systems.api.events.emit("AvatarImporterRunningUpdate", { running: false });
  }

  importAvatars(filePath: string, concurrency: number, skipCache: boolean) {
    if (this.running) {
      this.systems.api.toast.error("Avatar import already in progress.", { duration: 5000 });
      return Promise.resolve(false);
    }
    return new Promise<boolean>((resolve) => {
      this.running = true;
      this.lastConfig = { filePath, concurrency, skipCache };
      this.systems.api.events.emit("AvatarImporterRunningUpdate", { running: true });
      const AvatarIdRegex = this.systems.api.constants.AvatarIdRegex;
      const queue = new PQueue({ concurrency });

      this.systems.api.logger.info("AvatarImporter", "Starting avatar import.", { filePath, concurrency });
      this.systems.api.toast.info("Starting avatar import.", {
        description: `Importing avatars from file ${path.basename(filePath)}...`,
        duration: 5000,
        dismissable: true,
      });

      const startTime = Date.now();
      let count = 0;

      this.systems.api.events.emit("AvatarImporterProgressUpdate", { count, elapsed: 0 });
      lineReader.eachLine(filePath, { bufferSize: 1024 }, async (line, last, continueCb) => {
        if (!this.running) return resolve(false);
        for (const match of line.matchAll(AvatarIdRegex)) {
          const avatarId = match[0];
          queue.add(async () => {
            await this.systems.cacheScanner.handleNewAvatar(avatarId, true, skipCache);
            count++;
            this.systems.api.events.emit("AvatarImporterProgressUpdate", { count, elapsed: Date.now() - startTime });
          });
        }

        continueCb?.();
        if (last) {
          await queue.onIdle();
          this.systems.api.events.emit("AvatarImporterProgressUpdate", { count, elapsed: Date.now() - startTime });
          this.systems.api.logger.info("AvatarImporter", "Finished importing avatars from file.", { filePath, concurrency });
          this.systems.api.toast.success("Finished importing avatars from file.", {
            description: `Imported ${count} avatars in ${Math.round((Date.now() - startTime) / 1000 / 60)} minutes.`,
            duration: 15000,
          });
          this.running = false;
          this.lastConfig = null;
          this.systems.api.events.emit("AvatarImporterRunningUpdate", { running: false });
          resolve(true);
        }
      });
    });
  }
}