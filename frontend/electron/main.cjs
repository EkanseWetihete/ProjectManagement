/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const { app, BrowserWindow, dialog, session } = require("electron");
const { autoUpdater } = require("electron-updater");

const isDevelopment = process.env.APP_ENV === "development";
const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || readEnvValue("NEXT_PUBLIC_API_URL") || "http://127.0.0.1:8000").replace(/\/$/, "");
const apiClientKey = process.env.PM_APP_CLIENT_KEY || readEnvValue("PM_APP_CLIENT_KEY");
const updateUrl = (process.env.PM_UPDATE_URL || readEnvValue("PM_UPDATE_URL") || `${apiBaseUrl}/updates/win`).replace(/\/$/, "");
let mainWindow = null;

function readEnvValue(key) {
  const candidates = [".env.production", ".env.local", ".env"];

  for (const fileName of candidates) {
    const filePath = path.join(__dirname, "..", fileName);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const envKey = trimmed.slice(0, separatorIndex).trim();
      if (envKey !== key) {
        continue;
      }

      return trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  }

  return "";
}

function configureApiHeaderInjection() {
  if (!apiClientKey) {
    return;
  }

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    if (details.url.startsWith(`${apiBaseUrl}/api/`)) {
      details.requestHeaders["X-Project-Client-Key"] = apiClientKey;
    }

    callback({ requestHeaders: details.requestHeaders });
  });
}

function configureAutoUpdates() {
  if (isDevelopment || !app.isPackaged) {
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.setFeedURL({
    provider: "generic",
    url: updateUrl,
  });

  autoUpdater.on("error", (error) => {
    console.error("Auto-update failed", error);
  });

  autoUpdater.on("update-downloaded", async () => {
    if (!mainWindow) {
      autoUpdater.quitAndInstall();
      return;
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["Restart now", "Later"],
      defaultId: 0,
      cancelId: 1,
      title: "Update ready",
      message: "A new version has been downloaded.",
      detail: "Restart the app to finish installing the update.",
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.checkForUpdates().catch((error) => {
    console.error("Checking for updates failed", error);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1460,
    height: 920,
    minWidth: 1180,
    minHeight: 780,
    backgroundColor: "#0d1322",
    title: "Project Management",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (isDevelopment) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  mainWindow.loadFile(path.join(__dirname, "..", "out", "index.html"));
}

app.whenReady().then(() => {
  configureApiHeaderInjection();
  createWindow();
  configureAutoUpdates();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
