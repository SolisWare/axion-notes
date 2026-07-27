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
import { protectedHandle, protectedOn } from "./protectedIpc";

type SettingsIpcOptions = {
  lockStateService: LockStateService;
  onSettingsChange?: (settings: AppSettings) => void;
  settingsService: SettingsService;
};

export function registerSettingsIpc(options: SettingsIpcOptions): void {
  ipcMain.handle(channels.settings.getSettings, async () => {
    return options.settingsService.getSettings();
  });

  protectedHandle<string, []>(channels.settings.getSettingsFolderLocation, { ...options, fallback: "" }, () => {
    return options.settingsService.getSettingsFolderLocation();
  });

  protectedOn<[AppSettings]>(channels.settings.setSettings, options, (_, settings) => {
    options.settingsService.setSettings(settings);
    options.onSettingsChange?.(settings);

    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(channels.settings.onSettingsChange, settings);
      }
    });
  });
}
