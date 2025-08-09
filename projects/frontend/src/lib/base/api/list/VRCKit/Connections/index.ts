import type { VRCKit } from "..";
import { Patreon } from "./Patreon";

export class Connections {
  patreon = new Patreon(this);
  constructor(public vrckit: VRCKit) { }
}