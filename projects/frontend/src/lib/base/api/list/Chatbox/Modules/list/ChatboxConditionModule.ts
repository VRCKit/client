import type { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";

export class ChatboxConditionModule extends ChatboxModule {
  constructor(public modules: Modules) {
    super(modules, "condition", "Condition", {
      description: "Condition module, used to compare values and return a result based on the comparison. Supports inline placeholders.",
      example_placeholders: [
        {
          placeholder: "==;1;1;true;false",
          description: "Check if two values are equal."
        },
        {
          placeholder: "!==;1;1;true;false",
          description: "Check if two values are not equal."
        },
        {
          placeholder: ">;1;1;true;false",
          description: "Check if the first value is greater than the second value."
        },
        {
          placeholder: "<;1;1;true;false",
          description: "Check if the first value is less than the second value."
        },
        {
          placeholder: ">=;1;1;true;false",
          description: "Check if the first value is greater than or equal to the second value."
        },
        {
          placeholder: "<=;1;1;true;false",
          description: "Check if the first value is less than or equal to the second value."
        },
        {
          placeholder: "&&;true;false;true;false",
          description: "Check if both values are true."
        },
        {
          placeholder: "||;true;false;true;false",
          description: "Check if at least one value is true."
        }
      ]
    });
  }

  async getPlaceholder(key: string, args: string[]): Promise<string> {
    const [a, b, trueValue = "", falseValue = ""] = await this.modules.fillTemplates(args, "[[:]]");

    switch (key) {
      case "==": return a === b ? trueValue : falseValue;
      case "!=": return a !== b ? trueValue : falseValue;
      case ">": return Number(a) > Number(b) ? trueValue : falseValue;
      case "<": return Number(a) < Number(b) ? trueValue : falseValue;
      case ">=": return Number(a) >= Number(b) ? trueValue : falseValue;
      case "<=": return Number(a) <= Number(b) ? trueValue : falseValue;
      case "&&": return a && b ? trueValue : falseValue;
      case "||": return a || b ? trueValue : falseValue;
    }

    return key;
  }
}