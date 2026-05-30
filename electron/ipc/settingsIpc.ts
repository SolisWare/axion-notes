/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { AppSettings } from "../../src/settings/AppSettings";
import { channels } from "./channels";
import { getSettings, setSettings } from "../storage/appSettingsStorage";

type SettingsIpcOptions = {
  appSettingsFilePath: string;
};

export function registerSettingsIpc(options: SettingsIpcOptions): void {
  ipcMain.handle(channels.settings.getSettings, async () => {
    return getSettings(options.appSettingsFilePath);
  });

  ipcMain.handle(channels.settings.getSettingsFolderLocation, () => {
    return path.dirname(options.appSettingsFilePath);
  });

  ipcMain.on(channels.settings.setSettings, (_, settings: AppSettings) => {
    setSettings(options.appSettingsFilePath, settings);
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(channels.settings.onSettingsChange, settings);
      }
    });
  });
}
