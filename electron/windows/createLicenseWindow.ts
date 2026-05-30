/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow } from "electron";
import * as path from "path";
import isDev from "electron-is-dev";
import { getAppIconPath } from "./appIcon";
import { dev, production } from "./routes";

export function createLicenseWindow(): BrowserWindow {
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
    icon: getAppIconPath(),
    title: "Axion Notes — License",
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
    licenseWindow.setTitle("Axion Notes — License");
  });

  if (isDev) {
    licenseWindow.loadURL(dev("license"));
  } else {
    licenseWindow.loadFile(...production("license"));
  }

  return licenseWindow;
}
