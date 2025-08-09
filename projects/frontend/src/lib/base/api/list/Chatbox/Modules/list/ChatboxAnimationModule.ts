import { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";

export class ChatboxAnimationModule extends ChatboxModule {
  animationData: Map<string, { at: number, index: number, last: string }> = new Map();
  constructor(public modules: Modules) {
    super(modules, "animation", "Animation", {
      description: "Animation module, used to animate text.",
      inputs: [
        {
          type: "Number",
          id: "animation_breath_max_spaces",
          name: "Animation: Breath Max Spaces",
          description: "Max spaces for the breath animation.",
          default_value: 3
        }
      ],
      example_placeholders: [
        {
          placeholder: "breath;HelloWorld",
          description: "Breath animation."
        },
        {
          placeholder: "marquee;HelloWorld",
          description: "Marquee animation."
        },
        {
          placeholder: "marquee;HelloWorld;5",
          description: "Marquee animation. With length."
        },
        {
          placeholder: "wave;HelloWorld",
          description: "Wave animation."
        },
        {
          placeholder: "random_case;HelloWorld",
          description: "Random case animation."
        },
        {
          placeholder: "random_hide;HelloWorld",
          description: "Random hide animation."
        },
        {
          placeholder: "each_one;Hello;World",
          description: "Each one animation."
        },
        {
          placeholder: "blink;HelloWorld",
          description: "Blink animation."
        }
      ]
    });

    setInterval(() => {
      this.animationData.forEach((data, key) => {
        if (Date.now() - data.at > 60000) this.animationData.delete(key);
      });
    }, 60000);
  }

  async getPlaceholder(animationType: string, args: string[]): Promise<string> {
    const rawContent = args.join(";");
    const originalContent = await this.modules.fillTemplate(rawContent, "[[:]]");

    const data = this.animationData.get(rawContent) || { at: 0, index: 0, last: originalContent };

    if (Date.now() - data.at < this.modules.chatbox.api.constants.ChatboxUpdateDelay) return data.last;
    switch (animationType) {
      case "breath": {
        const maxSpaces = this.getInputValue("animation_breath_max_spaces");
        const spaces = " ".repeat(data.index > maxSpaces ? (maxSpaces * 2) - data.index : data.index);
        data.last = [...originalContent].join(spaces);
        data.index = (data.index + 1) % (maxSpaces * 2);
        break;
      }
      case "marquee": {
        const chars = [...originalContent.split(";")[0]];
        const length = parseInt(rawContent.split(";")[1]) || chars.length;
        data.last = [...(chars.slice(data.index).join("") + chars.slice(0, data.index).join(""))].slice(0, length).join("");
        data.index = (data.index + 1) % chars.length;
        break;
      }
      case "wave": {
        data.last = [...originalContent].map((char, index) => char === " " ? char : index % 2 === data.index ? char.toUpperCase() : char.toLowerCase()).join("");
        data.index = (data.index + 1) % 2;
        break
      }
      case "random_case": {
        data.last = [...originalContent].map((char) => Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()).join("");
        break;
      }
      case "random_hide": {
        data.last = [...originalContent].map((char) => Math.random() > 0.5 ? " " : char).join("");
        break;
      }
      case "each_one": {
        const parts = originalContent.split(";");
        data.last = parts[data.index];
        data.index = (data.index + 1) % parts.length;
        break;
      }
      case "blink": {
        data.last = data.last === "" ? originalContent : "";
        break;
      }
    }

    data.at = Date.now();
    this.animationData.set(rawContent, data);
    return data.last;
  }
}