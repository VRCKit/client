
import type { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";

export class ChatboxProgressBarModule extends ChatboxModule {
  data = {
    styles: {
      bar: {
        complete: "▒",
        incomplete: "░",
        head: "▓"
      },
      circle: {
        complete: "●",
        incomplete: "○",
        head: "◉"
      },
      arrow: {
        complete: "▶",
        incomplete: "▷",
        head: "▷"
      },
      ascii: {
        complete: "=",
        incomplete: "-",
        head: ">"
      },
      dot: {
        complete: "●",
        incomplete: "○",
        head: "◐"
      },
      slash: {
        complete: "\\",
        incomplete: " ",
        head: "/"
      },
      square: {
        complete: "■",
        incomplete: "▢",
        head: "■"
      },
      parallelogram: {
        complete: "▰",
        incomplete: "▱",
        head: "▰"
      },
      structured: {
        prepend: "╞",
        complete: "═",
        incomplete: "═",
        head: "▰",
        append: "╡"
      }
    } as Record<string, { complete: string, incomplete: string, head: string, prepend?: string, append?: string }>
  }

  constructor(public modules: Modules) {
    super(modules, "progress_bar", "Progress Bar", {
      description: "Display a progress bar with a custom style.",
      inputs: [
        {
          type: "KeyValues",
          id: "custom_style",
          name: "Custom Style",
          default_value: {
            prepend: "",
            complete: "=",
            incomplete: "-",
            head: ">",
            append: "",
          },
          key_display_names: {
            prepend: "Prepend",
            complete: "Complete",
            incomplete: "Incomplete",
            head: "Head",
            append: "Append",
          }
        },
        {
          type: "KeyValues",
          id: "text_slice_style",
          name: "Text Slice Style",
          default_value: {
            prepend: "[",
            complete: "VRCKitIsAwesome",
            head: ">",
            incomplete: " ",
            append: "]",
          },
          key_display_names: {
            prepend: "Prepend",
            complete: "Complete",
            incomplete: "Incomplete",
            head: "Head",
            append: "Append",
          }
        }
      ],
    });

    this.config.example_placeholders = [
      ...Object.entries(this.data.styles)
        .map(([key, val]) => ({
          placeholder: `${key};10;[[media:raw_current_time]];[[media:raw_total_time]]`,
          description: `Style: ${key[0].toUpperCase()}${key.slice(1)} [${val.prepend || ""}${val.complete}${val.head}${val.incomplete}${val.append || ""}] Progress Bars works with the other modules, like media, time, etc. You need the give the bar length as the first argument, then the current value and the maximum value as the second and third arguments respectively.`,
        })),
      {
        placeholder: "custom;10;[[media:raw_current_time]];[[media:raw_total_time]]",
        description: "Custom Style. Progress Bars works with the other modules, like media, time, etc. You need the give the bar length as the first argument, then the current value and the maximum value as the second and third arguments respectively."
      },
      {
        placeholder: "text_slice;[[media:raw_current_time]];[[media:raw_total_time]]",
        description: "Text Slice Style. Progress Bars works with the other modules, like media, time, etc. You need the give the bar length as the first argument, then the current value and the maximum value as the second and third arguments respectively."
      },
      {
        placeholder: "custom_value;10;[[media:raw_current_time]];[[media:raw_total_time]];prepend;complete;head;incomplete;append",
        description: "Custom Value Style. Progress Bars works with the other modules, like media, time, etc. You need the give the bar length as the first argument, then the current value and the maximum value as the second and third arguments respectively."
      }
    ];
  }

  renderProgress(complete: string, incomplete: string, head: string, barLength: number, progress: number, prepend?: string, append?: string): string {
    const filledBars = Math.floor(progress * barLength);
    const hasHead = filledBars < barLength ? 1 : 0;
    const emptyBars = barLength - filledBars - hasHead - (prepend ? 1 : 0) - (append ? 1 : 0);

    return (prepend || "") + complete.repeat(filledBars) + (hasHead ? head : "") + incomplete.repeat(emptyBars) + (append || "");
  }
  async getPlaceholder(key: string, args: string[]): Promise<string> {
    args = await this.modules.fillTemplates(args, "[[:]]");
    switch (key) {
      case "text_slice": {
        const config = this.getInputValue("text_slice_style");
        const barLength = config.complete.length;
        const currentValue = parseFloat(args[0]) || 0;
        const maxValue = parseFloat(args[1]) || 1;
        const progress = Math.max(0, Math.min(1, currentValue / maxValue));
        const [complete, incomplete, head, prepend, append] = await this.modules.fillTemplates([config.complete, config.incomplete, config.head, config.prepend || '', config.append || ''], "{{;}}");
        return prepend + complete.slice(0, Math.ceil(progress * barLength)) + head + incomplete.repeat(barLength - Math.ceil(progress * barLength)) + append;
        break;
      }
      default: {
        const barLength = parseInt(args[0]) || 10;
        const currentValue = parseFloat(args[1]) || 0;
        const maxValue = parseFloat(args[2]) || 1;
        const progress = Math.max(0, Math.min(1, currentValue / maxValue));
        const style = (() => {
          switch (key) {
            case "custom":
              return this.getInputValue("custom_style");
            case "custom_value":
              return {
                prepend: args[3] || "",
                complete: args[4] || "=",
                head: args[5] || ">",
                incomplete: args[6] || "-",
                append: args[7] || ""
              }
            default: return this.data.styles[key as keyof typeof this.data.styles];
          }
        })();
        const [complete, incomplete, head, prepend, append] = await this.modules.fillTemplates([style.complete, style.incomplete, style.head, style.prepend || '', style.append || ''], "{{;}}");
        return this.renderProgress(
          complete,
          incomplete,
          head,
          barLength,
          progress,
          prepend,
          append
        )
      }
    }
  }
}