/* eslint-disable @typescript-eslint/no-explicit-any */

import type { VRCKitAPI } from "../VRCKitAPI";
import * as axios from "axios";

export type HTTPResponse = { data: any, status: number, statusText: string, headers: any, url: string, error?: string };

export class HTTP {
  _init = false;
  constructor(public api: VRCKitAPI) {

  }

  private async clientFetch(reqData: axios.AxiosRequestConfig): Promise<HTTPResponse> {
    try {
      const response = await axios.default(reqData);
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        url: response.request.responseURL
      };
    } catch (error) {
      return {
        error: (error as any).message,
        data: (error as any).response?.data,
        status: (error as any).response?.status,
        statusText: (error as any).response?.statusText,
        headers: (error as any).response?.headers,
        url: (error as any).response?.request?.responseURL
      };
    }
  }

  private async serverFetch(reqData: axios.AxiosRequestConfig & { useProxy?: boolean }): Promise<HTTPResponse> {
    return await this.api.ipcRenderer.invoke("Fetch", reqData);
  }

  async fetch(reqData: axios.AxiosRequestConfig & { side: "Client" | "Server", useProxy?: boolean }): Promise<HTTPResponse> {
    switch (reqData.side) {
      case "Client":
        return await this.clientFetch(reqData);
      case "Server":
        const cfg = await this.api.config.get("HTTPProxy", { enabled: false, http: undefined, https: undefined });
        if (cfg?.enabled && (cfg?.http || cfg?.https)) {
          reqData.useProxy = true;
          const url = new URL(reqData.url || "", reqData.baseURL);
          reqData.headers = {
            ...reqData.headers,
            "X-Target": url.origin,
          };
        }
        return await this.serverFetch(reqData);
    }
  }

  async init() {
    if (this._init) return;
    this._init = true;

    const cfg = (await this.api.config.get("HTTPProxy", { enabled: false, http: undefined, https: undefined }))!;
    this.api.ipcRenderer.send("UpdateFetchProxyAgent", {
      http: cfg.http || undefined,
      https: cfg.https || undefined
    });
    this.api.logger.info("HTTP", "Initialized with proxy settings", {
      enabled: cfg.enabled,
      http: cfg.http || "Not set",
      https: cfg.https || "Not set"
    });
  }

  async destroy() { }
}
