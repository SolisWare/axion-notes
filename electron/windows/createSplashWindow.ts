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
import { blockProductionDevTools, getDevToolsWebPreferences } from "../utils/devTools";
import { registerWindowNavigationGuards } from "./windowSecurity";

function getSplashFilePath(): string {
  return isDev
    ? path.join(process.cwd(), "public/splash.html")
    : path.join(__dirname, "../../splash.html");
}

export function createSplashWindow(): BrowserWindow {
  const splashWindow = new BrowserWindow({
    width: 360,
    height: 240,
    center: true,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: "#00000000",
    icon: isMac ? getAppIconPath() : getWindowIconPath(),
    webPreferences: {
      ...getDevToolsWebPreferences(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  splashWindow.once("ready-to-show", () => {
    splashWindow.show();
  });

  blockProductionDevTools(splashWindow);
  registerWindowNavigationGuards(splashWindow, { allowedFilePaths: [getSplashFilePath()] });
  splashWindow.loadFile(getSplashFilePath());

  return splashWindow;
}
