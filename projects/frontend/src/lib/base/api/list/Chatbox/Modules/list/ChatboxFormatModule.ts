import * as textFormats from "$lib/base/data/text-formats.json";
import type { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";
import mapReplace from "stuffs/lib/mapReplace";

export class ChatboxFormatModule extends ChatboxModule {
  constructor(public modules: Modules) {
    super(modules, "format", "Format", {
      description: "Format module, used to format text.",
      example_placeholders: [
        {
          placeholder: "superscript;HelloWorld",
          description: "Convert text to ˢᵘᵖᵉʳˢᶜʳⁱᵖᵗ."
        },
        {
          placeholder: "rounded;HelloWorld",
          description: "Convert text to ⓡⓞⓤⓝⓓⓔⓓ."
        },
        {
          placeholder: "small_caps;HelloWorld",
          description: "Convert text to ꜱᴍᴀʟʟᴄᴀᴘꜱ."
        }
      ]
    });
  }

  async getPlaceholder(key: string, args: string[]): Promise<string> {
    const value = await this.modules.fillTemplate(`${args.join(";")}`, "[[:]]");
    return mapReplace(value.toLowerCase(), textFormats[key as keyof typeof textFormats] ?? {});
  }
}