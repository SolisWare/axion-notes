/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { registerAppWindowIpc } from "./appWindowIpc";
import { registerMenuIpc } from "./menuIpc";
import { registerNoteSortIpc } from "./noteSortIpc";
import { registerSettingsIpc } from "./settingsIpc";
import { registerStorageIpc } from "./storageIpc";
import { registerSystemThemeIpc } from "./systemThemeIpc";
import { AppSettings } from "../../src/settings/AppSettings";

type IpcHandlerOptions = {
  appDataDir: string;
  appSettingsFilePath: string;
  initialSettings?: AppSettings;
  onSettingsChange?: (settings: AppSettings) => void;
};

export function registerIpcHandlers(options: IpcHandlerOptions): void {
  registerAppWindowIpc();
  registerSystemThemeIpc();
  registerStorageIpc({ appDataDir: options.appDataDir });
  registerMenuIpc();
  registerNoteSortIpc();
  registerSettingsIpc({
    appSettingsFilePath: options.appSettingsFilePath,
    initialSettings: options.initialSettings,
    onSettingsChange: options.onSettingsChange
  });
}
