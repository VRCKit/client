const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, session } = require('electron');
const path = require('path');
const axios = require("axios");
const isDev = require('electron-is-dev');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');
const cp = require('child_process');
const fs = require('original-fs');
const mimeTypes = require('mime-types');
const http = require('http');
const semver = require('semver');

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('vrckit', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('vrckit')
}
app.setAppUserModelId("rest.armagan.vrckit");

const isDevCustom = isDev && !process.env.VRCKIT_DEV;
const ServerPort = 4543;

const TargetUrl = `http://localhost:${isDevCustom ? 5173 : ServerPort}`;
const SafeUrls = [
  "https://vrckit.com",
  "https://api.vrckit.com",
  "https://files.vrchat.cloud",
  "https://vrchat.com",
  "https://github.com",
  "https://raw.githubusercontent.com",
  "https://release-assets.githubusercontent.com",
  TargetUrl
];
const CSP = [
  `default-src 'self' ${SafeUrls.join(' ')};`,
  `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${SafeUrls.join(' ')};`,
  `style-src 'self' 'unsafe-inline' ${SafeUrls.join(' ')};`,
  `img-src 'self' data: blob: ${SafeUrls.join(' ')};`,
  `font-src 'self' data: ${SafeUrls.join(' ')};`,
  `connect-src 'self' *;`,
  `media-src 'self' blob: data: ${SafeUrls.join(' ')};`,
  `frame-src 'self' ${SafeUrls.join(' ')};`,
  `object-src 'none';`,
  `base-uri 'self';`,
  `form-action 'self';`
].join(' ');

async function loadHTTPServer() {
  const appPath = app.getPath("userData");
  const buildPath = path.join(appPath, 'build/build');

  http.createServer(async (req, res) => {
    let filePath = path.join(buildPath, req.url === '/' ? 'index.html' : req.url);
    if (!filePath.startsWith(buildPath)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    try {
      if (!fs.existsSync(filePath)) filePath = path.join(buildPath, 'index.html');
      const data = await fs.promises.readFile(filePath);
      res.writeHead(200, {
        'Content-Type': mimeTypes.contentType(filePath),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Security-Policy': CSP
      });
      res.end(data);
    } catch (error) {
      console.error("Error serving file:", error);
      res.writeHead(404);
      res.end("Not Found");
    }
  }).listen(ServerPort);

  return ServerPort;
}

async function main() {
  await app.whenReady();
  console.log("Checking for updates...");
  const destroyUpdater = await checkForUpdates();
  console.log(isDevCustom ? "Running in development mode." : "Running in production mode.");
  if (!isDevCustom) {
    console.log("Loading HTTP server...");
    await loadHTTPServer();
  }
  await createWindow();
  console.log("Application is ready.");
  destroyUpdater();
}

function extractArchive(sourcePath, destinationPath, progressCallback) {
  return new Promise(async (resolve, reject) => {
    if (fs.existsSync(destinationPath)) {
      await fs.promises.rm(destinationPath, { recursive: true, force: true });
      await fs.promises.mkdir(destinationPath, { recursive: true });
    }
    const proc = cp.spawn(
      path.join(app.getPath("userData"), '7z.exe'),
      ['x', '-y', sourcePath.replace("/", path.sep), `-o${destinationPath.replace("/", path.sep)}`, '-bsp1'],
      {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    proc.stderr.on('data', (data) => {
      console.error("7z error:", data.toString());
      reject(new Error(`7z error: ${data.toString()}`));
    });

    proc.stdout.on('data', (data) => {
      console.log("7z output:", data.toString());
      if (progressCallback) {
        const percentMatch = data.toString().match(/(\d+)%/);
        if (percentMatch) {
          const percent = parseInt(percentMatch[1], 10);
          progressCallback(percent);
        }
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`7z exited with code ${code}`));
      }
    });
  });
}

async function downloadFile(url, outputPath, progressCallback) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true });

  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream',
    onDownloadProgress: progressCallback
  }).catch(err => {
    console.error("Failed to download extractor:", err);
  });
  response.data.pipe(fs.createWriteStream(outputPath));
  await new Promise((resolve, reject) => {
    response.data.once('end', resolve);
    response.data.once('error', reject);
  });
  await new Promise(r => setTimeout(r, 20));
}

async function checkForUpdates() {
  const appPath = app.getPath("userData");
  const updaterWindow = new BrowserWindow({
    width: 300,
    height: 400,
    frame: false,
    transparent: false,
    backgroundColor: "#09090b",
    resizable: false,
    autoHideMenuBar: true,
    center: true,
    title: "VRCKit - Updater",
    hasShadow: false,
    darkTheme: true,
    alwaysOnTop: true,
  });

  await updaterWindow.loadFile(path.join(__dirname, 'updater.html'))
  updaterWindow.show();

  function updateStatus(status) {
    updaterWindow.setTitle(`VRCKit - Updater - ${status}`);
    updaterWindow.webContents.executeJavaScript(`API.updateStatus(${JSON.stringify(status)})`);
  }

  function updateProgress(progress) {
    updaterWindow.setProgressBar(progress / 100, { mode: 'normal' });
    updaterWindow.webContents.executeJavaScript(`API.updateProgress(${JSON.stringify(progress)})`);
  }

  const sevenExePath = path.join(app.getPath("userData"), '7z.exe');
  const sevenDllPath = path.join(app.getPath("userData"), '7z.dll');

  if (!fs.existsSync(sevenExePath)) {
    const sevenDll = "https://github.com/TheArmagan/vrckit-assets/releases/download/7z-v25.01/7z.dll";
    updateStatus("Downloading extractor...");
    updateProgress(0);

    await downloadFile(sevenDll, sevenDllPath, (progressEvent) => {
      const total = progressEvent.total || 1; // Avoid division by zero
      const progress = Math.round((progressEvent.loaded / total) * 50);
      updateProgress(progress);
      updateStatus(`Downloading extractor... (${((progressEvent.rate / 1024 / 1024) || 0).toFixed(2)} MB/sec)`);
    });

    const sevenExe = "https://github.com/TheArmagan/vrckit-assets/releases/download/7z-v25.01/7z.exe";
    updateStatus("Downloading extractor...");
    updateProgress(0);

    await downloadFile(sevenExe, sevenExePath, (progressEvent) => {
      const total = progressEvent.total || 1; // Avoid division by zero
      const progress = Math.round((progressEvent.loaded / total) * 50) + 50;
      updateProgress(progress);
      updateStatus(`Downloading extractor... (${((progressEvent.rate / 1024 / 1024) || 0).toFixed(2)} MB/sec)`);
    });

    updateStatus("Extractor downloaded successfully.");
    updateProgress(100);
  }

  updateStatus("Checking for native updates...");
  updateProgress(5);

  const latestRendererMetaRes = await axios({
    method: "GET",
    url: "https://raw.githubusercontent.com/VRCKit/client/refs/heads/main/build-meta/latest/renderer.json",
  });

  const currentVersion = app.getVersion();
  const latestVersion = latestRendererMetaRes.data.version;

  if (semver.lt(currentVersion, latestVersion)) {
    updateStatus(`Downloading native update... (v${latestVersion})`);

    const assetUrl = `https://github.com/VRCKit/client/releases/download/${latestRendererMetaRes.data.tag}/${latestRendererMetaRes.data.filename.replaceAll(" ", ".")}`;
    const tempFilePath = path.join(process.env.TEMP, `VRCKit-Latest.exe`);

    try {
      await downloadFile(
        assetUrl,
        tempFilePath,
        (progressEvent) => {
          const total = progressEvent.total || 1; // Avoid division by zero
          const progress = Math.round((progressEvent.loaded / total) * 95); // 95% for download progress
          updateStatus(`Downloading update... (${((progressEvent.rate / 1024 / 1024) || 0).toFixed(2)} MB/sec)`);
          updateProgress(progress + 5); // Add 5% for the download progress
        }
      );
    } catch (error) {
      console.error("Failed to download update:", error);
      updateStatus("Failed to download update.");
      updateProgress(100);
      return () => updaterWindow.destroy();
    }

    updateStatus("Waiting for updater...");
    await new Promise(r => setTimeout(r, 500));

    cp.spawn(tempFilePath, [], {
      detached: true,
      stdio: "ignore"
    }).unref();

    setTimeout(() => {
      app.quit();
    }, 1);

    return;
  }

  updateStatus("Checking for web updates...");
  updateProgress(10);

  const currentMd5Path = fs.existsSync(path.join(appPath, 'build/build.md5.txt'));
  const currentMd5 = currentMd5Path ? await fs.promises.readFile(path.join(appPath, 'build/build.md5.txt'), 'utf8') : "0";

  const latestFrontendMetaRes = await axios.get('https://raw.githubusercontent.com/VRCKit/client/refs/heads/main/build-meta/latest/frontend.json');
  const remoteMD5 = latestFrontendMetaRes.data.md5;

  if (currentMd5 === remoteMD5) {
    updateStatus("No updates available.");
    updateProgress(100);
    return () => updaterWindow.destroy();
  }

  const remoteZipUrl = `https://github.com/VRCKit/client/releases/download/${latestFrontendMetaRes.data.tag}/build.zip`;
  const tempZipPath = path.join(appPath, 'temp_build.zip');
  updateStatus(`Downloading update... (v${latestFrontendMetaRes.data.version})`);

  try {
    await downloadFile(
      remoteZipUrl,
      tempZipPath,
      (progressEvent) => {
        const total = progressEvent.total || 1; // Avoid division by zero
        const progress = Math.round((progressEvent.loaded / total) * 40); // 40% for download progress
        updateStatus(`Downloading update... (${((progressEvent.rate / 1024 / 1024) || 0).toFixed(2)} MB/sec)`);
        updateProgress(progress + 10); // Add 10% for the download progress
      }
    );
  } catch (error) {
    console.error("Failed to download update:", error);
    updateStatus("Failed to download update.");
    updateProgress(100);
    return () => updaterWindow.destroy();
  }

  updateStatus("Extracting update...");

  await extractArchive(tempZipPath, path.join(appPath, 'build'), (progress) => {
    updateProgress((progress / 100 * 50) + 50); // 50% for extraction progress
  });

  updateStatus("Updating build metadata...");
  await fs.promises.writeFile(path.join(appPath, 'build/build.md5.txt'), remoteMD5, 'utf8');

  updateProgress(100);
  updateStatus("Starting...");

  await fs.promises.unlink(tempZipPath)
    .catch(err => console.error("Failed to delete temporary zip file:", err));
  updateStatus("Update complete.");

  return () => updaterWindow.destroy();
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    transparent: false,
    backgroundColor: "#09090b",
    resizable: true,
    autoHideMenuBar: true,
    center: true,
    title: "VRCKit",
    hasShadow: false,
    darkTheme: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInSubFrames: false,
      nodeIntegrationInWorker: false,
      contextIsolation: false,
      backgroundThrottling: false,
      webSecurity: true
    },
  });

  const tray = new Tray(path.join(__dirname, "icon.png"));
  tray.setToolTip("VRCKit");
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: "VRCKit",
      sublabel: app.getVersion(),
      enabled: false
    },
    {
      type: "separator"
    },
    {
      label: "Show",
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: "Dev Console",
      click: () => {
        mainWindow.webContents.isDevToolsOpened()
          ? mainWindow.webContents.closeDevTools()
          : mainWindow.webContents.openDevTools();
      }
    },
    {
      label: "Quit",
      click: () => {
        app.quit();
      }
    }
  ]));

  tray.addListener("click", () => {
    mainWindow.show();
  });

  ipcMain.on("Quit", () => {
    app.quit();
  });

  ipcMain.on("Hide", () => {
    mainWindow.hide();
  });

  ipcMain.on("Show", () => {
    mainWindow.show();
  });

  ipcMain.on("GetPath", (event, arg) => {
    if (arg === "appPath") {
      event.returnValue = app.getAppPath();
      return;
    }

    try {
      event.returnValue = app.getPath(arg);
    } catch {
      event.returnValue = null;
    }
  });

  ipcMain.on("GetAppName", (event, arg) => {
    event.returnValue = app.getName();
  });

  ipcMain.on("Relaunch", (event, arg) => {
    app.relaunch();
    app.exit();
  });

  let httpsProxyAgent = null;
  let httpProxyAgent = null;

  ipcMain.on("UpdateFetchProxyAgent",
    /** @param {axios.AxiosRequestConfig<any>} reqData **/
    (event, arg) => {
      if (arg && arg.https) {
        if (httpsProxyAgent) httpsProxyAgent.destroy();
        httpsProxyAgent = new HttpsProxyAgent(arg.https);
      } else {
        if (httpsProxyAgent) httpsProxyAgent.destroy();
        httpsProxyAgent = null;
      }

      if (arg && arg.http) {
        if (httpProxyAgent) httpProxyAgent.destroy();
        httpProxyAgent = new HttpProxyAgent(arg.http);
      } else {
        if (httpProxyAgent) httpProxyAgent.destroy();
        httpProxyAgent = null;
      }

      if (!httpsProxyAgent && httpProxyAgent) {
        httpsProxyAgent = new HttpsProxyAgent(arg.http);
      }
    }
  );

  ipcMain.handle(
    "Fetch",
    /** @param {axios.AxiosRequestConfig<any> & { useProxy?: boolean }} reqData **/
    async (event, reqData = {}) => {
      try {
        reqData.httpAgent = reqData.useProxy ? httpProxyAgent : null;
        reqData.httpsAgent = reqData.useProxy ? httpsProxyAgent : null;
        const response = await axios(reqData);
        return {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          url: response.request.res.responseUrl
        };
      } catch (error) {
        return {
          error: error.message,
          data: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          url: error.response?.request?.res?.responseUrl
        };
      }
    }
  );

  ipcMain.handle(
    "DownloadFile",
    async (event, { url, path }) => {
      try {
        await downloadFile(url, path);
        return { success: true };
      } catch (error) {
        return { error: error.message };
      }
    }
  );

  ipcMain.handle("ShowDialog", async (
    event,
    {
      mode = "open",
      openDirectory = false,
      openFile = true,
      multiSelections = false,
      filters,
      promptToCreate = false,
      defaultPath,
      title,
      showOverwriteConfirmation,
      message,
      showHiddenFiles,
      modal = false,
      buttons,
      defaultId,
      type,
      cancelId
    } = {}
  ) => {
    const show = {
      open: dialog.showOpenDialog,
      save: dialog.showSaveDialog,
      message: dialog.showMessageBox,
    }[mode];
    if (!show) return { error: `Invalid mode.`, ok: false };

    return await show.apply(dialog, [
      modal && BrowserWindow.fromWebContents(event.sender),
      {
        defaultPath,
        filters,
        title,
        message,
        createDirectory: true,
        buttons,
        type,
        defaultId,
        cancelId,
        properties: [
          showHiddenFiles && "showHiddenFiles",
          openDirectory && "openDirectory",
          promptToCreate && "promptToCreate",
          openDirectory && "openDirectory",
          openFile && "openFile",
          multiSelections && "multiSelections",
          showOverwriteConfirmation && "showOverwriteConfirmation"
        ].filter(i => i),
      }
    ].filter(i => i))
  });

  ipcMain.on("GetAppVersion", async (e) => {
    e.returnValue = app.getVersion();
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [CSP]
      }
    });
  })

  await mainWindow.loadURL(TargetUrl, {
    userAgent: `VRCKit/${app.getVersion()}`,
    extraHeaders: `Content-Security-Policy: ${CSP}`
  });
}

app.whenReady().then(async () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }
  main();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('second-instance', (event, argv) => {
  let win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  win.show();
  win.focus();

  let deepLink = argv.pop();
  if (deepLink && deepLink.startsWith("vrckit://")) {
    deepLink = deepLink.replace("vrckit://", "");
    if (deepLink.startsWith("/")) deepLink = deepLink.slice(1);
    if (deepLink.endsWith("/")) deepLink = deepLink.slice(0, -1);
    deepLink = decodeURIComponent(deepLink);
    win.webContents.send("DeepLink", deepLink);
  }
});