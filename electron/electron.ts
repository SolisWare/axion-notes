/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app, BrowserWindow, Menu } from "electron";
import * as path from "path";
import { createMenubar } from "./menu";
import { isDev } from "./utils/isDev";
import { isMac } from './utils/Platform';
import * as fs from 'node:fs';
import appVersionConfig from "../app-version-config.json";
import { AppVersionResolver } from "../src/utils/app-version/AppVersionResolver";
import { createMainWindow } from "./windows/createMainWindow";
import { createSplashWindow } from "./windows/createSplashWindow";
import { getAppIconPath } from "./utils/appIcon";
import { registerIpcHandlers } from "./ipc/registerIpcHandlers";
import { getSettings, setSettings } from "./storage/appSettingsStorage";
import { setElectronLanguage } from "./utils/electronI18n";
import { AppSettings } from "../src/settings/AppSettings";
import { NoteLayoutPreference } from "../src/settings/NoteLayoutPreference";
import { defaultAppSettings } from "../src/settings/defaultSettings";
import { resolvePreferredSupportedLanguageCode } from "../src/i18n/languageConfig";

const appDir = path.join(app.getPath("userData"));
const appDataDir = path.join(appDir, 'data');
const appSettingsDir = path.join(appDir, 'settings');
const appSettingsFilePath = path.join(appSettingsDir, 'app-settings.json');
const mainWindowStateFilePath = path.join(appSettingsDir, 'main-window-state.json');
let currentSettings: AppSettings | undefined;

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

// This method is called when Electron has finished the initialization
// and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  const settings = await getSettings(appSettingsFilePath);
  const initialSettings = {
    ...defaultAppSettings,
    ...settings,
    ...(!settings ? { language: resolvePreferredSupportedLanguageCode([app.getLocale()]) } : {})
  };

  currentSettings = initialSettings;
  setElectronLanguage(initialSettings.language);

  if (!settings) {
    setSettings(appSettingsFilePath, initialSettings);
  }

  Menu.setApplicationMenu(createMenubar());

  if (isMac) {
    app.dock?.setIcon(getAppIconPath());
  }

  const splashWindow = createSplashWindow();

  registerIpcHandlers({
    appDataDir,
    appSettingsFilePath,
    initialSettings,
    mainWindowStateFilePath,
    onSettingsChange: (settings: AppSettings) => {
      currentSettings = settings;
      setElectronLanguage(settings.language);
    }
  });
  createMainWindow({
    mainWindowStateFilePath,
    initialNoteLayout: currentSettings?.noteLayout ?? NoteLayoutPreference.GRID,
    splashWindow
  });
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
    createMainWindow({
      mainWindowStateFilePath,
      initialNoteLayout: currentSettings?.noteLayout ?? NoteLayoutPreference.GRID
    });
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
