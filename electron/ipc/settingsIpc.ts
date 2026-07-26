/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { AppSettings } from "../../src/settings/AppSettings";
import { LockStateService } from "../security/LockStateService";
import { SettingsService } from "../storage/SettingsService";
import { channels } from "./channels";

type SettingsIpcOptions = {
  lockStateService: LockStateService;
  onSettingsChange?: (settings: AppSettings) => void;
  settingsService: SettingsService;
};

export function registerSettingsIpc(options: SettingsIpcOptions): void {
  ipcMain.handle(channels.settings.getSettings, async () => {
    return options.settingsService.getSettings();
  });

  ipcMain.handle(channels.settings.getSettingsFolderLocation, () => {
    if (options.lockStateService.getIsLocked()) {
      return "";
    }

    return options.settingsService.getSettingsFolderLocation();
  });

  ipcMain.on(channels.settings.setSettings, (_, settings: AppSettings) => {
    if (options.lockStateService.getIsLocked()) {
      return;
    }

    options.settingsService.setSettings(settings);
    options.onSettingsChange?.(settings);

    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(channels.settings.onSettingsChange, settings);
      }
    });
  });
}
