/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { contextBridge } from "electron";
import { appWindowApi } from "./appWindowApi";
import { backupApi } from "./backupApi";
import { menuApi } from "./menuApi";
import { noteSortApi } from "./noteSortApi";
import { noteWindowApi } from "./noteWindowApi";
import { osApi } from "./osApi";
import { securityApi } from "./securityApi";
import { restoreApi } from "./restoreApi";
import { settingsApi } from "./settingsApi";
import { storageApi } from "./storageApi";
import { systemThemeApi } from "./systemThemeApi";
import { versionApi } from "./versionApi";

// All Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

contextBridge.exposeInMainWorld('api', {
  appWindow: appWindowApi,
  backup: backupApi,
  storage: storageApi,
  menu: menuApi,
  noteSort: noteSortApi,
  noteWindow: noteWindowApi,
  security: securityApi,
  restore: restoreApi,
  settings: settingsApi,
  version: versionApi,
  systemTheme: systemThemeApi,
  os: osApi
});
