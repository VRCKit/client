import { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";

export class ChatboxShortcutModule extends ChatboxModule {

  constructor(public modules: Modules) {
    super(modules, "shortcut", "Shortcut", {
      description: "Shortcut module, used to replace a key with a value. Allows you to use nested placeholders.",
      inputs: [
        {
          type: "KeyValues",
          id: "shortcuts",
          name: "Shortcuts",
          description: "List of shortcuts",
          allow_custom_keys: true,
          default_value: {
            media_base: "{{media;playback_status}} '{{media;title}} ᵇʸ {{media;artist}}' {{format;superscript;[[media:current_time]]/[[media:total_time]]}}\n{{media;current_lyric_line}}",
            media_not_playing: "⏸️ Nothing Playing",
            media_if_playing: "{{condition;==;[[media:raw_playback_status]];Playing;[[shortcut:media_base]];[[shortcut:media_not_playing]]}}"
          }
        }
      ],
      example_placeholders: [
        {
          placeholder: "media_example",
          description: "Example of using the media module with a shortcut."
        },
        {
          placeholder: "shortcut_name;some;args",
          description: "Replace a shortcut with some arguments. Args are can be used in the shortcut value with $0, $1, $2, etc."
        }
      ]
    });
  }

  async getPlaceholder(key: string, args: string[]): Promise<string> {
    const shortcuts = this.getInputValue("shortcuts");
    if (!shortcuts[key]) return key;
    args = await this.modules.fillTemplates(args, "{{;}}");
    return await this.modules.fillTemplate((shortcuts[key] || "").replace(/\$(\d+)/g, (itself: unknown, index: number) => args[index] || itself), "{{;}}");
  }
}