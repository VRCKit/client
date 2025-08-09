import type { Moderation } from "..";
import { Blocked } from "./Blocked";
import { BlockedAuthors } from "./BlockedAuthors";
import { Reports } from "./Reports";

export class Avatars {
  blocked = new Blocked(this);
  blockedAuthors = new BlockedAuthors(this);
  reports = new Reports(this);
  constructor(public moderation: Moderation) { }
}