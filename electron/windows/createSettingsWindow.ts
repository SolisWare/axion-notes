/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow } from "electron";
import * as path from "path";
import { getAppIconPath } from "../utils/appIcon";
import { dev, production } from "./routes";
import { isDev } from "../utils/isDev";

export function createSettingsWindow(): BrowserWindow {
  const settingsWindow = new BrowserWindow({
    width: 660,
    height: 542,
    minWidth: 600,
    minHeight: 420,
    show: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    icon: getAppIconPath(),
    title: "Axion Notes — Settings",
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    }
  });

  settingsWindow.setMenu(null);
  settingsWindow.setMenuBarVisibility(false);

  settingsWindow.once("ready-to-show", () => {
    settingsWindow.show();
  });

  settingsWindow.on("page-title-updated", (event) => {
    event.preventDefault();
    settingsWindow.setTitle("Axion Notes — Settings");
  });

  if (isDev) {
    settingsWindow.loadURL(dev("settings"));
  } else {
    settingsWindow.loadFile(...production("settings"));
  }

  return settingsWindow;
}
