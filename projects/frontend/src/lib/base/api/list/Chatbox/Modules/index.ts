import type { Chatbox } from "..";
import type { ChatboxModule } from "./ChatboxModule";
import { ChatboxAnimationModule } from "./list/ChatboxAnimationModule";
import { ChatboxConditionModule } from "./list/ChatboxConditionModule";
import { ChatboxFormatModule } from "./list/ChatboxFormatModule";
import { ChatboxMediaModule } from "./list/ChatboxMediaModule";
import mapReplace from "stuffs/lib/mapReplace";
import { ChatboxProgressBarModule } from "./list/ChatboxProgressBarModule";
import { ChatboxShortcutModule } from "./list/ChatboxShortcutModule";
import { ChatboxTimeModule } from "./list/ChatboxTimeModule";
import { ChatboxPulsoidModule } from "./list/ChatboxPulsoidModule";
import { ChatboxHTTPModule } from "./list/ChatboxHTTPModule";
import { ChatboxAFKModule } from "./list/ChatboxAFKModule";
import { ChatboxMathModule } from "./list/ChatboxMathModule";
import { ChatboxSpeechToTextModule } from "./list/ChatboxSpeechToTextModule";

const PlaceholderRegex1 = /{{([^}]+)}}/g;
const PlaceholderRegex2 = /\[\[([^\]]+)\]\]/g;

export class Modules {
  list = new Map<string, ChatboxModule>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recursivePreventInterval: any = null;
  callsMadeMap: Map<string, number> = new Map();
  ignoreSet: Set<string> = new Set();

  constructor(public chatbox: Chatbox) { }

  async register(mod: ChatboxModule, init = true) {
    this.list.set(mod.id, mod);
    this.chatbox.api.logger.debug("Chatbox", "Module registered", mod.id, mod.name);
    if (init) await mod.init();
  }

  async unregister(mod: ChatboxModule, destroy = true) {
    this.list.delete(mod.id);
    this.chatbox.api.logger.debug("Chatbox", "Module unregistered", mod.id, mod.name);
    if (destroy) await mod.destroy();
  }

  async init() {
    this.recursivePreventInterval = setInterval(() => {
      this.callsMadeMap.clear();
    }, 1000);

    this.register(new ChatboxMediaModule(this), true);
    this.register(new ChatboxShortcutModule(this), true);
    this.register(new ChatboxAnimationModule(this), true);
    this.register(new ChatboxProgressBarModule(this), true);
    this.register(new ChatboxTimeModule(this), true);
    this.register(new ChatboxSpeechToTextModule(this), true);
    this.register(new ChatboxPulsoidModule(this), true);
    this.register(new ChatboxHTTPModule(this), true);
    this.register(new ChatboxAFKModule(this), true);

    this.register(new ChatboxFormatModule(this), true);
    this.register(new ChatboxConditionModule(this), true);
    this.register(new ChatboxMathModule(this), true);
  }

  private async incrementCallCount(moduleId: string, key: string, args: string[]) {
    const fullKey = `${moduleId};${key};${args.join(";")}`;
    const currentCount = this.callsMadeMap.get(fullKey) || 0;
    this.callsMadeMap.set(fullKey, currentCount + 1);
    if (currentCount >= 500) {
      if (!this.ignoreSet.has(fullKey)) {
        this.chatbox.api.logger.error("Chatbox", `Preventing recursive calls for module ${moduleId} key ${key} due to excessive calls (${currentCount + 1})`);
        this.chatbox.api.toast.error("Chatbox", {
          description: `Prevented recursive calls for module ${moduleId} key ${key} due to excessive calls (${currentCount + 1}). This may indicate a user-made bug in the module.`,
          duration: 1000,
        });
        setTimeout(() => {
          this.ignoreSet.delete(fullKey);
        }, 1000);
      }
      this.ignoreSet.add(fullKey);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Prevent further calls for 1 second
    }
  }

  async fillTemplate(text: string, type: "{{;}}" | "[[:]]" = "{{;}}", ignored: { moduleId: string, key: string, return?: string }[] = []): Promise<string> {
    const matches = [...text.matchAll(type === "{{;}}" ? PlaceholderRegex1 : PlaceholderRegex2)];
    const results: Record<string, string> = {};
    results["{{nl}}"] = results["[[nl]]"] = "\n";
    const isPremium = await this.isPremium();
    await Promise.all(matches.map(async (match) => {
      if (results[match[0]]) return;
      try {
        const args = match[1].split(type === "{{;}}" ? ";" : ":");
        const moduleId = args.shift()!;
        const key = args.shift()!;
        const ignoredMatch = ignored.find(i => i.moduleId === moduleId && i.key === key);
        if (ignoredMatch) {
          results[match[0]] = ignoredMatch.return ?? match[0];
          return;
        }

        if (this.ignoreSet.has(key)) {
          results[match[0]] = `(Ignored: ${match[0]})`;
          return;
        }
        await this.incrementCallCount(moduleId, key, args);
        if (this.ignoreSet.has(key)) {
          results[match[0]] = `(Ignored: ${match[0]})`;
          return;
        }

        const m = this.list.get(moduleId);
        if (m) {
          const content = await m.getPlaceholder(key, args);
          if (content !== null) {
            if (m.config.is_premium && !isPremium) {
              results[match[0]] = `(Premium Module: ${match[0]})`;
            } else {
              results[match[0]] = content;
            }
          } else {
            results[match[0]] = `(Missing: ${match[0]})`;
          }
        }
      } catch (e) {
        this.chatbox.api.logger.error("Chatbox", "Failed to replace placeholder", match[0], e);
      }
    }));
    return mapReplace(text, results);
  }

  async fillTemplates(texts: string[], type: "{{;}}" | "[[:]]" = "{{;}}", ignored: { moduleId: string, key: string, return?: string }[] = []): Promise<string[]> {
    return (await this.fillTemplate(texts.join("䡁"), type, ignored)).split("䡁");
  }

  getAllInputValues(force: boolean) {
    return Object.fromEntries(
      [
        ...this.list.values()
      ].map((module) => [module.id, module.getAllInputValues(force)])
    );
  }

  setAllInputValues(values: Record<string, unknown>) {
    for (const [moduleId, moduleValues] of Object.entries(values)) {
      const module = this.list.get(moduleId);
      if (module) module.setAllInputValues(moduleValues as Record<string, unknown>);
    }
  }

  async destroy() {
    for (const mod of this.list.values()) {
      await this.unregister(mod, true);
    }
    this.list.clear();
    if (this.recursivePreventInterval) {
      clearInterval(this.recursivePreventInterval);
      this.recursivePreventInterval = null;
      this.callsMadeMap.clear();
      this.ignoreSet.clear();
    }
  }

  async isPremium(): Promise<boolean> {
    return await this.chatbox.api.vrckit.users.current.isPremium('Admin', 'Owner', 'Moderator');
  }
}