import threeDots from "stuffs/lib/threeDots";
import type { OSC } from ".";

export class Chatbox {
  lastTypingState = false;

  constructor(public osc: OSC) { }

  send(message: string, egg: boolean = false) {
    this.osc.send("/chatbox/input", threeDots(message, egg ? 142 : 144) + (egg ? "\u0003\u001f" : ""), true);
  }

  fill(message: string) {
    this.osc.send("/chatbox/input", message, false);
  }

  toggleTyping(state: boolean) {
    this.lastTypingState = state;
    this.osc.send("/chatbox/typing", state);
  }
}