/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app, BrowserWindow, Menu, session } from "electron";
import * as path from "path";
import { createMenubar } from "./menu";
import { isDev } from "./utils/isDev";
import { isMac } from './utils/Platform';
import * as fs from 'node:fs';
import appVersionConfig from "../app-version-config.json";
import { AppVersionResolver } from "../src/utils/app-version/AppVersionResolver";
import { createMainWindow } from "./windows/createMainWindow";
import { closeNoteWindows } from "./windows/createNoteWindow";
import { closeSettingsWindow } from "./windows/createSettingsWindow";
import { createSplashWindow } from "./windows/createSplashWindow";
import { getAppIconPath } from "./utils/appIcon";
import { registerIpcHandlers } from "./ipc/registerIpcHandlers";
import { setElectronLanguage } from "./utils/electronI18n";
import { AppSettings } from "../src/settings/AppSettings";
import { NoteLayoutPreference } from "../src/settings/NoteLayoutPreference";
import { defaultAppSettings } from "../src/settings/defaultSettings";
import { resolvePreferredSupportedLanguageCode } from "../src/i18n/languageConfig";
import { resolvePreferredDateFormat } from "../src/utils/dt-formatter/dateFormatConfig";
import { resolvePreferredTimeFormat } from "../src/utils/dt-formatter/timeFormatConfig";
import { BruteForceProtectionService } from "./security/BruteForceProtectionService";
import { EncryptionKeyService } from "./security/EncryptionKeyService";
import { EncryptionService } from "./security/EncryptionService";
import { LockMarkerService } from "./security/LockMarkerService";
import { LockStateService } from "./security/LockStateService";
import { PasswordService } from "./security/PasswordService";
import { NoteService } from "./storage/NoteService";
import { SettingsService } from "./storage/SettingsService";

const appDir = path.join(app.getPath("userData"));
const appDataDir = path.join(appDir, 'data');
const appSecurityDir = path.join(appDir, 'security');
const appSettingsDir = path.join(appDir, 'settings');
const appSettingsFilePath = path.join(appSettingsDir, 'app-settings.json');
const lockMarkerPath = path.join(appDir, '.lock');
const encryptionRecordPath = path.join(appSecurityDir, 'encryption.json');
const mainWindowStateFilePath = path.join(appSettingsDir, 'main-window-state.json');
const bruteForceProtectionRecordPath = path.join(appSecurityDir, 'brute-force-protection.json');
const passwordRecordPath = path.join(appSecurityDir, 'password.json');
let currentSettings: AppSettings | undefined;
let lockStateService: LockStateService | undefined;
let settingsService: SettingsService | undefined;

async function loadAppSettings(settingsService: SettingsService, refreshFromDisk = false): Promise<{ settings: AppSettings; hasSettingsFile: boolean }> {
  const settings = refreshFromDisk
    ? await settingsService.refreshSettings()
    : await settingsService.getSettings();

  return {
    settings: {
      ...defaultAppSettings,
      ...settings,
      ...(!settings ? {
        dateFormat: resolvePreferredDateFormat([app.getLocale()]),
        language: resolvePreferredSupportedLanguageCode([app.getLocale()]),
        timeFormat: resolvePreferredTimeFormat([app.getLocale()])
      } : {})
    },
    hasSettingsFile: Boolean(settings)
  };
}

// Create the 'data' directory if it doesn't exist.
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
}
// Create the 'settings' directory if it doesn't exist.
if (!fs.existsSync(appSettingsDir)) {
  fs.mkdirSync(appSettingsDir, { recursive: true });
}
// Create the 'security' directory if it doesn't exist.
if (!fs.existsSync(appSecurityDir)) {
  fs.mkdirSync(appSecurityDir, { recursive: true });
}

// Load variables from ".env" file and merge with "process.env"
// FOR DEV MODE ONLY!
if (isDev) {
  // Load dotenv only in development so production packages do not require it.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
}

app.on("web-contents-created", (_event, contents) => {
  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
});

function registerSessionSecurityHandlers(): void {
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
}

// This method is called when Electron has finished the initialization
// and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  registerSessionSecurityHandlers();

  settingsService = new SettingsService(appSettingsFilePath);
  const { settings: initialSettings, hasSettingsFile } = await loadAppSettings(settingsService);

  currentSettings = initialSettings;
  setElectronLanguage(initialSettings.language);
  const bruteForceProtectionService = new BruteForceProtectionService(bruteForceProtectionRecordPath);
  const encryptionService = new EncryptionService();
  const encryptionKeyService = new EncryptionKeyService(encryptionService);
  const lockMarkerService = new LockMarkerService(lockMarkerPath);
  const noteService = new NoteService(appDataDir, encryptionRecordPath, encryptionService, encryptionKeyService);
  const passwordService = new PasswordService(passwordRecordPath);
  lockStateService = new LockStateService(passwordService, bruteForceProtectionService, lockMarkerService, noteService);

  await lockStateService.initialize(initialSettings);
  lockStateService.onLockStateChange((lockState) => {
    if (lockState.isLocked) {
      closeNoteWindows();
      closeSettingsWindow();
    }
  });

  if (!hasSettingsFile) {
    settingsService.setSettings(initialSettings);
  }

  Menu.setApplicationMenu(createMenubar({
    onLockNotes: () => {
      lockStateService?.lock().catch((err) => {
        console.warn("Failed to lock notes from menu:", err);
      });
    }
  }));

  if (isMac) {
    app.dock?.setIcon(getAppIconPath());
  }

  const splashWindow = createSplashWindow();

  registerIpcHandlers({
    appDataDir,
    lockStateService,
    mainWindowStateFilePath,
    noteService,
    onSettingsChange: (settings: AppSettings) => {
      currentSettings = settings;
      setElectronLanguage(settings.language);
    },
    passwordService,
    settingsService
  });
  createMainWindow({
    mainWindowStateFilePath,
    initialNoteLayout: currentSettings?.noteLayout ?? NoteLayoutPreference.GRID,
    lockStateService,
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
app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (!lockStateService || !settingsService) {
      return;
    }

    let settings = currentSettings ?? (await loadAppSettings(settingsService)).settings;

    if (settings.lockScreenEnabled || lockStateService.getIsLocked()) {
      settings = (await loadAppSettings(settingsService, true)).settings;
      currentSettings = settings;
      setElectronLanguage(settings.language);

      await lockStateService.refreshLockState(settings);
    }

    const splashWindow = createSplashWindow();

    createMainWindow({
      mainWindowStateFilePath,
      initialNoteLayout: settings.noteLayout,
      lockStateService,
      splashWindow
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
