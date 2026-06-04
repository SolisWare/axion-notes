/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app, BrowserWindow, Menu } from "electron";
import * as path from "path";
import menubar from "./menu";
import { isMac } from './utils/Platform';
import * as fs from 'node:fs';
import appVersionConfig from "../app-version-config.json";
import { AppVersionResolver } from "../src/utils/app-version/AppVersionResolver";
import { createMainWindow } from "./windows/createMainWindow";
import { getAppIconPath } from "./utils/appIcon";
import { registerIpcHandlers } from "./ipc/registerIpcHandlers";
import { isDev } from "./utils/isDev";

const appDir = path.join(app.getPath("userData"));
const appDataDir = path.join(appDir, 'data');
const appSettingsDir = path.join(appDir, 'settings');
const appSettingsFilePath = path.join(appSettingsDir, 'app-settings.json');
const mainWindowStateFilePath = path.join(appSettingsDir, 'main-window-state.json');

// Create the 'data' directory if it doesn't exist.
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
}
// Create the 'settings' directory if it doesn't exist.
if (!fs.existsSync(appSettingsDir)) {
  fs.mkdirSync(appSettingsDir, { recursive: true });
}

// Load variables from ".env" file and merge with "process.env"
// FOR DEV MODE ONLY!
if (isDev) {
  // Load dotenv only in development so production packages do not require it.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
}

// Load the menubar items
Menu.setApplicationMenu(menubar);

// This method is called when Electron has finished the initialization
// and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  if (isMac) {
    app.dock?.setIcon(getAppIconPath());
  }

  createMainWindow({ mainWindowStateFilePath });
  registerIpcHandlers({ appDataDir, appSettingsFilePath });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

// On macOS it's common to re-create a window in the app 
// when the dock icon is clicked and there are no other windows opened.
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow({ mainWindowStateFilePath });
  }
});

// "About" dialog window customization
app.setAboutPanelOptions({
  applicationName: "Axion Notes",
  applicationVersion: AppVersionResolver.getCombinedVersion(appVersionConfig),
  ...(AppVersionResolver.getAboutVersion(appVersionConfig) ? { version: AppVersionResolver.getAboutVersion(appVersionConfig) } : {}),
  authors: [
    "SolisWare"
  ],
  copyright: "Copyright © 2023-2026 SolisWare.\nAll rights reserved."
});
