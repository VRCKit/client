import type { VRCKit } from "..";
import { Audits } from "./Audits";
import { Avatars } from "./Avatars";
import { Users } from "./Users";

export class Moderation {
  users = new Users(this);
  audits = new Audits(this);
  avatars = new Avatars(this);
  constructor(public vrckit: VRCKit) { }
}