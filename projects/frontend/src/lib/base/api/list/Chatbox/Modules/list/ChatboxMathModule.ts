import { Fcal } from "fcal";
import type { Modules } from "..";
import { ChatboxModule } from "../ChatboxModule";

export class ChatboxMathModule extends ChatboxModule {

  fcal = new Fcal();

  constructor(public modules: Modules) {
    super(modules, "math", "Math", {
      description: "Math module, used to perform mathematical operations. More complex operations can be done using Fcal.",
      example_placeholders: [
        {
          placeholder: "expr;4+4",
          description: "Evaluate a mathematical expression. Example: `{{expr;2+2}}` will return `4`."
        }
      ]
    });
  }

  async getPlaceholder(key: string, args: string[]): Promise<string> {
    const value = (await this.modules.fillTemplates(args, "[[:]]")).join(";");
    if (key === "expr") return this.fcal.evaluate(value).toString();
    return value;
  }
}