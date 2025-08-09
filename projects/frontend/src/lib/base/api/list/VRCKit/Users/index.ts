import type { VRCKit } from "..";
import { Current } from "./Current";

export class Users {
  current = new Current(this);
  constructor(public vrckit: VRCKit) { }
}