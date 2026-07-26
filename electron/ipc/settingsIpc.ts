/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { AppSettings } from "../../src/settings/AppSettings";
import { channels } from "./channels";
import { SettingsService } from "../storage/SettingsService";

type SettingsIpcOptions = {
  onSettingsChange?: (settings: AppSettings) => void;
  settingsService: SettingsService;
};

export function registerSettingsIpc(options: SettingsIpcOptions): void {
  ipcMain.handle(channels.settings.getSettings, async () => {
    return options.settingsService.getSettings();
  });

  ipcMain.handle(channels.settings.getSettingsFolderLocation, () => {
    return options.settingsService.getSettingsFolderLocation();
  });

  ipcMain.on(channels.settings.setSettings, (_, settings: AppSettings) => {
    options.settingsService.setSettings(settings);
    options.onSettingsChange?.(settings);

    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(channels.settings.onSettingsChange, settings);
      }
    });
  });
}
