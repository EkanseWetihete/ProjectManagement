/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const { contextBridge } = require("electron");

function readEnvValue(key) {
  const candidates = [".env.local", ".env"];

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

function getApiClientKey() {
  return process.env.PM_APP_CLIENT_KEY || readEnvValue("PM_APP_CLIENT_KEY");
}

contextBridge.exposeInMainWorld("projectManagement", {
  platform: process.platform,
});
