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

let licenseWindow: BrowserWindow | null = null;

function focusLicenseWindow(window: BrowserWindow): void {
  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.moveTop();
  window.focus();
}

export function createLicenseWindow(): BrowserWindow {
  if (licenseWindow && !licenseWindow.isDestroyed()) {
    focusLicenseWindow(licenseWindow);
    return licenseWindow;
  }

  const windowTitle = `Axion Notes — ${translate("electron.windows.license")}`;

  const createdLicenseWindow = new BrowserWindow({
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
  licenseWindow = createdLicenseWindow;

  createdLicenseWindow.setMenu(null);
  createdLicenseWindow.setMenuBarVisibility(false);

  createdLicenseWindow.once("ready-to-show", () => {
    createdLicenseWindow.show();
  });

  createdLicenseWindow.on("closed", () => {
    if (licenseWindow === createdLicenseWindow) {
      licenseWindow = null;
    }
  });

  createdLicenseWindow.on("page-title-updated", (event) => {
    event.preventDefault();
    createdLicenseWindow.setTitle(windowTitle);
  });

  if (isDev) {
    createdLicenseWindow.loadURL(dev("license"));
  } else {
    createdLicenseWindow.loadFile(...production("license"));
  }

  return createdLicenseWindow;
}
