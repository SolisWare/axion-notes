/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow } from "electron";
import * as path from "path";
import isDev from "electron-is-dev";
import { dev, production } from "./routes";
import { getMainWindowLaunchBounds, readMainWindowState, saveMainWindowStateOnClose } from "./mainWindowState";

type MainWindowOptions = {
  mainWindowStateFilePath: string;
};

export function createMainWindow(options: MainWindowOptions): BrowserWindow {
  const mainWindowState = readMainWindowState(options.mainWindowStateFilePath);
  const mainWindowBounds = getMainWindowLaunchBounds(mainWindowState);

  const mainWindow = new BrowserWindow({
    ...mainWindowBounds,
    minWidth: 335,
    minHeight: 250,
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    }
  });

  if (mainWindowState.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", () => {
    saveMainWindowStateOnClose(mainWindow, options.mainWindowStateFilePath);
  });

  if (isDev) {
    mainWindow.loadURL(dev("main"));
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(...production("main"));
  }

  return mainWindow;
}
