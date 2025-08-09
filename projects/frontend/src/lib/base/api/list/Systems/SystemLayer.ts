/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-require-imports */
const process = require('process') as typeof import('process');
const path = require('path') as typeof import('path');
const cp = require("child_process") as typeof import("child_process");
const fs = require("original-fs") as typeof import("fs");
const JSONStream = require('json-stream');

import type { Systems } from ".";

const AppPath = path.join(process.env.APPDATA as string, "VRCKit");
const SystemLayerPath = path.join(AppPath, "SystemLayer");

const SystemLayerVersion = "0.0.4";

const execAsync = (require('util') as typeof import('util')).promisify(cp.exec);

export async function downloadFile(url: string, file: string) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  try {
    const res = await execAsync(
      `powershell "Invoke-WebRequest '${url}' -OutFile '${path.resolve(file)}'"`,
      {
        cwd: process.cwd(),
      }
    );
    throw new Error(`Failed to download file: ${res.stderr}`);
  } catch (e) {
    console.error(e);
  }
}

async function expandArchive(archivePath: string, destinationPath: string) {
  const res = await execAsync(
    `powershell "Expand-Archive -Force -Path '${path.resolve(archivePath)}' -DestinationPath '${path.resolve(destinationPath)}'"`,
    {
      cwd: process.cwd(),
    }
  );
  return !res.stderr?.trim?.();
}

export class SystemLayer {
  process: import("child_process").ChildProcessWithoutNullStreams | null = null;
  pendingMessages: any[] = [];
  constructor(public systems: Systems) { }

  async prepareSystemLayer() {
    if (!fs.existsSync(SystemLayerPath)) await fs.promises.mkdir(SystemLayerPath, { recursive: true });

    const systemLayerVersionPath = path.join(SystemLayerPath, "version.txt");
    const installedVersion = fs.existsSync(systemLayerVersionPath) ? await fs.promises.readFile(systemLayerVersionPath, "utf-8") : "0.0.0";

    if (installedVersion !== SystemLayerVersion) {
      this.systems.api.logger.info("SystemLayer", `Updating system layer from ${installedVersion} to ${SystemLayerVersion}`);

      const response = await this.systems.api.http.fetch({
        method: "GET",
        url: `https://api.github.com/repos/thearmagan/vrckit-assets/releases/tags/system-layer-v${SystemLayerVersion}`,
        headers: {
          "User-Agent": "VRCKit/v0.2.0",
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        },
        side: "Server"
      })

      if (response.status === 200) {
        const json = response.data;

        const asset = json.assets.find((asset: { name: string }) => asset.name.endsWith(".zip"));

        const tempFilePath = path.join(process.env.TEMP as string, "VRCKitSystemLayer.zip");

        await this.killAll();
        await new Promise((r) => setTimeout(r, 75));

        this.systems.api.toast.info("Downloading system layer update...");
        await downloadFile(
          asset.browser_download_url,
          tempFilePath,
        );

        const zipOutputPath = path.join(SystemLayerPath, "SystemLayer");
        if (fs.existsSync(zipOutputPath)) await fs.promises.rm(zipOutputPath, { recursive: true }).catch(() => { });

        this.systems.api.toast.info("Extracting system layer archive...");
        const extractSuccess = await expandArchive(tempFilePath, zipOutputPath);


        if (extractSuccess) {
          this.systems.api.toast.success("System layer updated successfully.");
          this.systems.api.logger.info("SystemLayer", `System layer updated successfully.`);
          await fs.promises.writeFile(systemLayerVersionPath, SystemLayerVersion);
        } else {
          this.systems.api.logger.error("SystemLayer", "Failed to extract system layer archive.");
          this.systems.api.toast.error("Failed to extract system layer archive.");
        }
      } else {
        this.systems.api.logger.error("SystemLayer", "Failed to fetch system layer update.", response);
        this.systems.api.toast.error("Failed to fetch system layer update.");
      }
    }

    return path.join(SystemLayerPath, "SystemLayer", "VRCKitSystemLayer", "VRCKitSystemLayer.exe");
  }

  async killAll() {
    await execAsync(`taskkill /F /IM VRCKitSystemLayer.exe`).catch(() => { });
  }

  async init() {
    const exePath = await this.prepareSystemLayer();
    if (!fs.existsSync(exePath)) {
      this.systems.api.logger.error("SystemLayer", "System layer executable not found.");
      this.systems.api.toast.error("System layer executable not found.");
      return;
    }

    try {
      const jsonStream = new JSONStream();

      await this.killAll();
      await new Promise((r) => setTimeout(r, 75));
      this.process = cp.spawn(exePath, [], {
        cwd: path.dirname(exePath),
      });

      this.systems.api.logger.info("SystemLayer", "System layer started.");

      this.process.stdout.setEncoding("utf-8");
      this.process.stdout.on("data", (data: any) => {
        jsonStream.write(data);
      });

      jsonStream.on("data", (data: any) => {
        this.systems.api.events.emit("SystemLayerMessage", data);
      });

      this.process.once("error", (err) => {
        this.systems.api.toast.error(`System layer error.`, { description: `${err}` });
        this.systems.api.logger.error("SystemLayer", `System layer error: ${err}`);
      });

      this.process.once("exit", () => {
        this.process?.removeAllListeners();
        this.process = null;
      });

      setTimeout(() => {
        this.pendingMessages.forEach((msg) => {
          this.send(msg.Type, msg.Data, true);
        });
        this.pendingMessages = [];
      }, 1000);
    } catch (e) {
      this.systems.api.toast.error(`Failed to set up system layer stdout stream.`, { description: `${e}` });
      this.systems.api.logger.error("SystemLayer", `Failed to set up system layer stdout stream. ${e}`);
    }
  }

  send(type: "InactivityThreshold", data: any, force = false) {
    if (!this.process && !force) {
      this.pendingMessages.push({ Type: type, Data: data });
      return;
    }

    try {
      this.process!.stdin.write(JSON.stringify({ Type: type, Data: data }) + "\n");
      this.systems.api.logger.debug("SystemLayer", `Sent message to system layer: ${type}`, data);
    } catch (e) {
      this.systems.api.logger.error("SystemLayer", `Failed to send message to system layer: ${e}`);
    }
  }

  async destroy() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}