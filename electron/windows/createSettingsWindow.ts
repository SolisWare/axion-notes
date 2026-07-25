/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow } from "electron";
import * as path from "path";
import { isDev } from "../utils/isDev";
import { getAppIconPath, getWindowIconPath } from "../utils/appIcon";
import { isMac } from "../utils/Platform";
import { translate } from "../utils/electronI18n";
import { dev, production } from "./routes";
import { blockProductionDevTools, getDevToolsWebPreferences } from "../utils/devTools";

let settingsWindow: BrowserWindow | null = null;

function focusSettingsWindow(window: BrowserWindow): void {
  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.moveTop();
  window.focus();
}

export function createSettingsWindow(): BrowserWindow {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    focusSettingsWindow(settingsWindow);
    return settingsWindow;
  }

  const windowTitle = `Axion Notes — ${translate("electron.windows.settings")}`;

  const createdSettingsWindow = new BrowserWindow({
    width: 730,
    height: 572,
    minWidth: 600,
    minHeight: 420,
    show: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    icon: isMac ? getAppIconPath() : getWindowIconPath(),
    title: windowTitle,
    webPreferences: {
      ...getDevToolsWebPreferences(),
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    }
  });
  settingsWindow = createdSettingsWindow;

  createdSettingsWindow.setMenu(null);
  createdSettingsWindow.setMenuBarVisibility(false);
  blockProductionDevTools(createdSettingsWindow);

  createdSettingsWindow.once("ready-to-show", () => {
    createdSettingsWindow.show();
  });

  createdSettingsWindow.on("closed", () => {
    if (settingsWindow === createdSettingsWindow) {
      settingsWindow = null;
    }
  });

  createdSettingsWindow.on("page-title-updated", (event) => {
    event.preventDefault();
    createdSettingsWindow.setTitle(windowTitle);
  });

  if (isDev) {
    createdSettingsWindow.loadURL(dev("settings"));
  } else {
    createdSettingsWindow.loadFile(...production("settings"));
  }

  return createdSettingsWindow;
}
