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

export function createLicenseWindow(): BrowserWindow {
  const windowTitle = `Axion Notes — ${translate("electron.windows.license")}`;

  const licenseWindow = new BrowserWindow({
    width: 560,
    height: 520,
    minWidth: 430,
    minHeight: 330,
    show: false,
    resizable: false,
    closable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    icon: isMac ? getAppIconPath() : getWindowIconPath(),
    title: windowTitle,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    }
  });

  licenseWindow.setMenu(null);
  licenseWindow.setMenuBarVisibility(false);

  licenseWindow.once("ready-to-show", () => {
    licenseWindow.show();
  });

  licenseWindow.on("page-title-updated", (event) => {
    event.preventDefault();
    licenseWindow.setTitle(windowTitle);
  });

  if (isDev) {
    licenseWindow.loadURL(dev("license"));
  } else {
    licenseWindow.loadFile(...production("license"));
  }

  return licenseWindow;
}
