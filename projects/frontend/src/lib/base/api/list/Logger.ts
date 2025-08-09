import type { VRCKitAPI } from "../VRCKitAPI";

export class Logger {
  constructor(public api: VRCKitAPI) { }

  private _log(level: "log" | "error" | "warn" | "info" | "debug", levelColor: string, title: string, args: unknown[]) {
    console[level](
      `%c ${new Date().toLocaleTimeString()} VRCKit ${title} %c`,
      `background: ${levelColor}; color: black; font-weight: bold; border-radius: 5px;`,
      "",
      ...args
    );
  }

  public log(title: string, ...args: unknown[]) {
    this._log("log", "#3c3c3c", title, args);
  }

  public info(title: string, ...args: unknown[]) {
    this._log("info", "#a5a4f7", title, args);
  }

  public error(title: string, ...args: unknown[]) {
    this._log("error", "#e78284", title, args);
  }

  public warn(title: string, ...args: unknown[]) {
    this._log("warn", "#e5c890", title, args);
  }

  public debug(title: string, ...args: unknown[]) {
    this._log("debug", "#eebebe", title, args);
  }
}