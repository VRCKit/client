/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from "lodash";
import { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";

export type HTTPComponentConfig = {
  Url: string;
  Method?: string; // GET or POST, default is GET
  Headers?: Record<string, string>;
  Body?: string;
  ResponseType?: "JSON" | "TEXT";
  CacheDuration?: number; // in milliseconds
};

export type RequestComponent = {
  getConfig(): Promise<HTTPComponentConfig>;
  parsedConfig: [string, string][];
  lastResponse?: any;
  lastRequestAt?: number;
}

export class ChatboxHTTPModule extends ChatboxModule {
  requestComponents: Map<string, RequestComponent> = new Map();
  lastComponents: string | null = null;
  constructor(public modules: Modules) {
    super(modules, "http", "HTTP", {
      is_premium: true,
      description: "HTTP request module, used to make HTTP requests and replace a key with the response.",
      inputs: [
        {
          type: "KeyValues",
          id: "http_components",
          name: "HTTP Components",
          description: "HTTP components to use in the request.",
          allow_custom_keys: true,
          default_value: {
            "random_quote": [
              `Url -> http://api.quotable.io/quotes/random?maxLength=50`,
              `Method -> GET`,
              `ResponseType -> JSON`,
              `CacheDuration -> 30000`
            ].join("\n"),
          },
          placeholder: [
            `Example HTTP request components: Every component is optional other than the Url. You can use other normal placeholders here.\n`,
            `Url -> https://example.com/api`,
            `Method -> GET or POST (default is GET)`,
            `Headers -> {"User-Agent": "VRCKit/0.0.0"}`,
            `Body -> {"key": "value"}`,
            `ResponseType -> JSON or TEXT`,
            `CacheDuration -> 30000 (in milliseconds, default is 30000, it will send a request every 30 seconds)`,
          ].join("\n")
        }
      ],
      example_placeholders: [
        {
          placeholder: "key",
          description: "Make an HTTP request with the key as the identifier. The key should match a key in the HTTP Components input."
        },
        {
          placeholder: "random_quote;[0].content",
          description: "Make an HTTP request with the key as the identifier and replace the key with the value at the specified JSON path in the response. The key should match a key in the HTTP Components input."
        }
      ]
    });
  }

  async updateConfig() {
    this.requestComponents.clear();
    const components = this.getInputValue("http_components");

    Object.entries(components).forEach(([componentKey, rawConfig]: any) => {
      const entries = rawConfig.trim().split("\n").map((line: string) => {
        return line.trim().split("->", 2).map((part: string) => part.trim());
      }) as [string, string][];

      this.requestComponents.set(componentKey, {
        getConfig: async () => {
          const replacedValues = await this.modules.fillTemplates(entries.map(i => i[1]), "{{;}}");
          const obj = Object.fromEntries(entries.map((entry, index) => [entry[0], replacedValues[index]]));

          const config: HTTPComponentConfig = {
            Url: obj["Url"],
            Method: obj["Method"] || "GET",
            Headers: obj["Headers"] ? JSON.parse(obj["Headers"]) : {},
            Body: obj["Body"],
            ResponseType: obj["ResponseType"] === "JSON" ? "JSON" : "TEXT",
            CacheDuration: parseInt(obj["CacheDuration"], 10) || 30000
          };

          return config;
        },
        parsedConfig: entries
      });
    });
  }

  updateConfigIfNeeded() {
    const components = this.getInputValue("http_components");
    if (JSON.stringify(components) === this.lastComponents) return;
    this.lastComponents = JSON.stringify(components);
    this.updateConfig();
  }

  async fetch(key: string, force: boolean = false): Promise<[HTTPComponentConfig, any] | null> {
    const component = this.requestComponents.get(key);
    if (!component) return null;

    const config = await component.getConfig();

    if (!config.Url) {
      this.modules.chatbox.api.logger.error("ChatboxHTTPModule", `No URL provided for component ${key}`);
      return [config, null];
    }

    if (!force && component.lastResponse && component.lastRequestAt && (Date.now() - component.lastRequestAt < (config.CacheDuration || 30000))) {
      return [config, component.lastResponse];
    };

    component.lastRequestAt = Date.now();
    (async () => {
      const res = await this.modules.chatbox.api.http.fetch({
        url: config.Url,
        method: config.Method,
        headers: {
          ...config.Headers,
          "User-Agent": `VRCKit/${this.modules.chatbox.api.constants.WebVersion}`
        },
        data: config.Body,
        side: "Server"
      });

      if (!res.status || !(res.status >= 200 && res.status < 300)) {
        this.modules.chatbox.api.logger.error("ChatboxHTTPModule", `Failed to fetch ${config.Url} for component ${key}`, res);
        return;
      }

      try {
        component.lastResponse = res.data;
        return;
      } catch (e) {
        this.modules.chatbox.api.logger.error("ChatboxHTTPModule", `Failed to parse response for component ${key}`, e, res);
        return;
      }
    })();

    return [config, component.lastResponse];
  }

  async getPlaceholder(key: string, args: string[]): Promise<string> {
    const [jsonPath] = await this.modules.fillTemplates(args, "{{;}}");

    this.updateConfigIfNeeded();
    if (!this.requestComponents.has(key)) return "InvalidKey";
    const res = await this.fetch(key, false);
    if (!res) return "RequestFailed";
    const [config, response] = res;
    if (!response) return "NoResponse";
    if (jsonPath && config.ResponseType === "JSON") {
      return _.get(response, jsonPath, `NoValueAtPath:${jsonPath}`);
    } else {
      return `${response || ""}`;
    }
  }
}