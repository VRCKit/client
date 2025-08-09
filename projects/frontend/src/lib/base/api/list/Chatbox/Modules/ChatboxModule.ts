/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Modules } from "."

export interface ChatboxModuleConfig {
  inputs?: (
    ({
      type: "Text",
      default_value?: string
    } | {
      type: "Number",
      default_value?: number
    } | {
      type: "Boolean",
      default_value?: boolean
    } | {
      type: "Select",
      default_value?: string,
      options: {
        name: string,
        value: string
      }[]
    } | {
      type: "KeyValues",
      default_value?: Record<string, string>,
      allow_custom_keys?: boolean,
      key_display_names?: Record<string, string>,
      key_type?: "Text" | "File",
      file_filters?: {
        name: string,
        extensions: string[]
      }[]
    }) & {
      id: string,
      name: string,
      description?: string,
      placeholder?: string,
      secret?: boolean,
      help?: {
        url: string,
        message: string
      }
    })[],
  constants?: Record<string, any>;
  placeholder_defaults?: Record<string, string>;
  example_placeholders?: {
    placeholder: string,
    description: string
  }[];
  description: string;
  is_premium?: boolean;
}

export class ChatboxModule {
  private _inputs: Record<string, any> = {};
  constructor(
    public modules: Modules,
    public id: string,
    public name: string,
    public config: ChatboxModuleConfig
  ) {
    if (this.config.inputs) this.config.inputs = this.config.inputs.map((input) => {
      input.default_value = typeof input.default_value === "object" ? { ...input.default_value } : input.default_value;
      return input;
    });
    this._inputs = JSON.parse(localStorage.getItem(`VRCLog;Chatbox;ModuleConfigs;${this.id}`) || "{}");
  }

  getInputValue(id: string): any {
    return this._inputs[id] || this.config.inputs?.find((input) => input.id === id)?.default_value;
  }

  setInputValue(id: string, value: any) {
    this._inputs[id] = value;
    localStorage.setItem(`VRCLog;Chatbox;ModuleConfigs;${this.id}`, JSON.stringify(this._inputs));
  }

  getAllInputValues(force: boolean): Record<string, any> {
    return Object.fromEntries((this.config.inputs || []).map(i => [i.id, i.secret && !force ? i.default_value : this.getInputValue(i.id)]));
  }

  setAllInputValues(values: Record<string, any>) {
    this._inputs = values;
    localStorage.setItem(`VRCLog;Chatbox;ModuleConfigs;${this.id}`, JSON.stringify(this._inputs));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPlaceholder(key: string, args: string[]): Promise<string> {
    return this.config.placeholder_defaults?.[key] || key;
  }

  getExamplePlaceholders(): { normal: string, inner: string, description: string }[] {
    return (this.config.example_placeholders || []).map((ph) => {
      return {
        normal: `{{${this.id};${ph.placeholder}}}`,
        inner: `[[${this.id}:${ph.placeholder.replaceAll(";", ":")}]]`,
        description: ph.description
      }
    });
  }

  async init() {

  }

  async destroy() { }
}