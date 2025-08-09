/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path") as typeof import("path");
const fs = require("fs") as typeof import("fs");

import { languages } from "$lib/other/googletrans/languages";
import { debounce } from "$lib/utils";
import type { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";

declare global {
  interface Window {
    recognitionCallback: (obj: any) => void;
    webkitSpeechRecognition: any;
    recognizer: any;
  }
}

export class ChatboxSpeechToTextModule extends ChatboxModule {

  browserPaths = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    "C:\\Program Files\\Opera\\launcher.exe",
    "C:\\Program Files\\Vivaldi\\Application\\vivaldi.exe",
    "C:\\Program Files\\Yandex\\YandexBrowser\\Application\\browser.exe",
    "C:\\Program Files\\Epic Privacy Browser\\epic.exe",
  ]

  broweserPath: string | null = null;

  browserState: "Offline" | "Loading" | "Ready" | "Failed" = "Offline";
  browser: import("puppeteer-core").Browser | null = null;
  page: import("puppeteer-core").Page | null = null;

  recignitionState: "Offline" | "Loading" | "Ready" = "Offline";

  constructor(public modules: Modules) {
    super(modules, "stt", "Speech To Text", {
      is_premium: true,
      description: "Recognize speech and convert it to text. And translate it to the language you want.",
      inputs: [
        {
          id: "enabled",
          name: "Enabled",
          description: "Enable or disable the Speech to Text module. This option is nessessary to prevent the module from running when not needed. To update config, you need to disable and enable the module again.",
          type: "Boolean",
          default_value: false,
        },
        {
          id: "language",
          name: "Language",
          type: "Select",
          description: "The language to use for speech recognition. If set to 'auto', the browser will try to detect the language automatically.",
          options: [
            {
              value: "",
              name: "Auto Detect",
            },
            ...Object.entries(languages)
              .map(([code, name]) => (
                {
                  value: code,
                  name: name
                }
              )).filter(({ value }) => value !== "auto")
          ],
          default_value: "",
        },
        {
          id: "interim_results",
          name: "Interim Results",
          description: "Enable interim results. This will return results as they are recognized, instead of waiting for the end of the speech. Disable when you going to use translation.",
          type: "Boolean",
          default_value: true,
        },
        {
          id: "result_timeout",
          name: "Result Timeout",
          description: "Timeout in milliseconds after which the last result will be cleared. This is useful to prevent the last result from being stale.",
          type: "Number",
          default_value: 6500,
        },
        {
          id: "translation_enabled",
          name: "Translation Enabled",
          description: "Enable translation of the recognized speech. This will translate the recognized speech to the language set in the 'Translate To' input.",
          type: "Boolean",
          default_value: false,
        },
        {
          id: "translate_to",
          name: "Translate To",
          type: "Select",
          description: "The language to translate the recognized speech to.",
          options: Object.entries(languages)
            .map(([code, name]) => (
              {
                value: code,
                name: name
              }
            )).filter(({ value }) => value !== "auto"),
          default_value: "en",
        },
        {
          id: "translate_debounce",
          name: "Translate Debounce",
          description: "Debounce time in milliseconds for the translation. This is useful to prevent the translation from being triggered too often.",
          type: "Number",
          default_value: 250,
        }
      ],
      example_placeholders: [
        {
          placeholder: "last_result",
          description: "Get the last recognized speech result."
        },
        {
          placeholder: "result",
          description: "Get the last recognized speech result. This value will be cleared after the result timeout."
        },
        {
          placeholder: "last_translated_result",
          description: "Get the last translated speech result."
        },
        {
          placeholder: "translated_result",
          description: "Get the last translated speech result. This value will be cleared after the result timeout."
        },
        {
          placeholder: "recognition_state",
          description: "Get the current state of the speech recognition. Possible values are 'Offline', 'Loading', 'Ready'."
        },
        {
          placeholder: "browser_state",
          description: "Get the current state of the browser. Possible values are 'Offline', 'Loading', 'Ready'."
        },
        {
          placeholder: "last_result_at",
          description: "Get the timestamp of the last recognized speech result."
        },
        {
          placeholder: "language",
          description: "Get the current language of the speech recognition."
        },
        {
          placeholder: "translate_to",
          description: "Get the current language to translate the recognized speech to."
        }
      ]
    });
  };

  lastResult: string | null = null;
  lastTranslatedResult: string | null = null;
  lastResultAt: number = 0;
  lastTranslatedAt: number = 0;

  async init() {
    for (const path of this.browserPaths) {
      if (fs.existsSync(path)) {
        this.broweserPath = path;
        break;
      }
    }
    if (!this.broweserPath) {
      this.modules.chatbox.api.logger.error("ChatboxSpeechToTextModule", "No browser executable found. Speech to Text module will not work.");
      this.modules.chatbox.api.toast.error("No browser executable found for Speech to Text module. Please install a supported browser.", { duration: 10000 });
      return;
    }
  }

  async translateLastResult() {
    let text = this.lastResult?.trim();
    if (!text) {
      this.lastTranslatedResult = null;
      return;
    }
    if (this.getInputValue("translation_enabled")) {
      this.lastTranslatedResult = null;
      try {
        const translated = await this.modules.chatbox.api.utils.translate(
          text,
          {
            from: this.getInputValue("language") || "auto",
            to: this.getInputValue("translate_to")
          }
        );
        this.lastTranslatedResult = translated.text;
        this.lastTranslatedAt = Date.now();
      } catch (error) {
        this.modules.chatbox.api.logger.error("ChatboxSpeechToTextModule", "Error while translating result", { text, error });
        this.lastTranslatedResult = null;
      }
    }
  }

  debouncedTranslateLastResult = debounce(this.translateLastResult.bind(this), this.getInputValue("translate_debounce") || 0);

  async loadIfNeeded() {
    if (!this.broweserPath) return;
    if (this.browserState === "Failed") return;
    if (this.browserState === "Ready" || this.browserState === "Loading") return;
    this.modules.chatbox.api.logger.info("ChatboxSpeechToTextModule", "Using browser executable", { path: this.broweserPath });

    const puppeteer = require("puppeteer-core") as typeof import("puppeteer-core");

    this.browserState = "Loading";
    this.recignitionState = "Loading";
    this.debouncedTranslateLastResult.setDuration(this.getInputValue("translate_debounce") || 0);

    this.browser = await puppeteer.launch({
      ignoreDefaultArgs: [
        "--mute-audio"
      ],
      enableExtensions: true,
      executablePath: this.broweserPath!,
      args: [
        "--use-fake-ui-for-media-stream"
      ],
      headless: "shell",
    }).catch((e) => {
      console.error(e);
      return null
    });

    if (!this.browser) {
      this.modules.chatbox.api.logger.error("ChatboxSpeechToTextModule", "Failed to launch browser", { error: "Browser launch failed" });
      this.modules.chatbox.api.toast.error("Failed to launch browser for Speech to Text module. Please check the console for more details.", { duration: 10000 });
      this.browserState = "Failed";
      this.recignitionState = "Offline";
      return;
    }

    this.page = await this.browser.newPage();

    await this.page.exposeFunction("recognitionCallback", async (obj: any) => {
      switch (obj.type) {
        case "RecognitionResult":
          this.lastResult = obj.text;
          this.lastResultAt = Date.now();

          this.lastTranslatedResult = null;
          this.debouncedTranslateLastResult();
          break;
        case "RecognitionStarted":
          this.modules.chatbox.api.logger.debug("ChatboxSpeechToTextModule", "Speech recognition started");
          this.modules.chatbox.api.toast.info("Speech recognition started", { duration: 1000 });
          this.recignitionState = "Ready";
          break;
        case "RecognitionEnded":
          this.modules.chatbox.api.logger.debug("ChatboxSpeechToTextModule", "Speech recognition ended");
          break;
        case "RecognitionRestarted":
          this.modules.chatbox.api.logger.debug("ChatboxSpeechToTextModule", "Speech recognition restarted");
          break;
      }
    });

    let language = this.getInputValue("language") || "";
    let interimResults = this.getInputValue("interim_results") || true;

    await this.page.evaluate(async ({ lang, interimResults }) => {
      window.recognizer = new window.webkitSpeechRecognition();
      window.recognizer.continuous = true;
      window.recognizer.interimResults = interimResults;
      window.recognizer.lang = lang;
      window.recognizer.onresult = function (event: any) {
        const text = event.results[event.resultIndex][0].transcript;
        window.recognitionCallback({
          type: "RecognitionResult",
          text: text,
        });
      };
      window.recognizer.onend = function () {
        window.recognitionCallback({
          type: "RecognitionEnded",
        });
        setTimeout(() => {
          window.recognizer.start();
          window.recognitionCallback({
            type: "RecognitionRestarted",
          });
        }, 100)
      };
      window.recognizer.start();
      window.recognitionCallback({
        type: "RecognitionStarted",
      });
    }, {
      lang: language,
      interimResults,
    });

    this.browserState = "Ready";
    this.modules.chatbox.api.logger.info("ChatboxSpeechToTextModule", "Browser launched", { state: this.browserState });
  }

  async unloadIfNeeded() {
    if (this.browserState !== "Ready" && this.browserState !== "Loading") return;
    this.browserState = "Offline";
    this.recignitionState = "Offline";
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    this.modules.chatbox.api.logger.info("ChatboxSpeechToTextModule", "Browser closed", { state: this.browserState });
    this.modules.chatbox.api.toast.info("Speech to Text module unloaded", { duration: 1000 });
  }

  async getPlaceholder(key: string): Promise<string> {
    if (this.getInputValue("enabled")) {
      this.loadIfNeeded();
    } else {
      this.unloadIfNeeded();
    }

    if (!this.browser || !this.page) {
      return "";
    }

    switch (key) {
      case "last_result":
        return this.lastResult || "";
      case "result":
        if (this.lastResultAt && Date.now() - this.lastResultAt < this.getInputValue("result_timeout")) {
          return this.lastResult || "";
        } else {
          return "";
        }
      case "last_translated_result":
        return this.lastTranslatedResult || "";
      case "translated_result":
        if (this.lastResultAt && Date.now() - this.lastTranslatedAt < this.getInputValue("result_timeout")) {
          return this.lastTranslatedResult || "";
        } else {
          return "";
        }
      case "recognition_state":
        return this.recignitionState;
      case "browser_state":
        return this.browserState;
      case "last_result_at":
        return this.lastResultAt ? new Date(this.lastResultAt).toISOString() : "";
      case "language":
        return this.getInputValue("language") || "auto";
      case "translate_to":
        return this.getInputValue("translate_to") || "en";
      default:
        return "";
    }
  }
};