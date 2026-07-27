/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, IpcMainEvent, ipcMain } from "electron";
import * as path from "path";
import { isDev } from "../utils/isDev";
import { dev, production } from "./routes";
import { getAppIconPath, getWindowIconPath } from "../utils/appIcon";
import { isMac } from "../utils/Platform";
import { getMainWindowLaunchBounds, readMainWindowState, saveMainWindowStateOnClose } from "./mainWindowState";
import { NoteLayoutPreference } from "../../src/settings/NoteLayoutPreference";
import { channels } from "../ipc/channels";
import { registerRichTextShortcuts } from "../utils/richTextShortcuts";
import { blockProductionDevTools } from "../utils/devTools";
import { LockStateService } from "../security/LockStateService";
import { getAppIndexFilePath, getAppWindowWebPreferences, registerWindowNavigationGuards } from "./windowSecurity";

type MainWindowOptions = {
  mainWindowStateFilePath: string;
  initialNoteLayout: NoteLayoutPreference;
  lockStateService: LockStateService;
  splashWindow?: BrowserWindow;
};

export function createMainWindow(options: MainWindowOptions): BrowserWindow {
  const mainWindowState = readMainWindowState(options.mainWindowStateFilePath);
  const mainWindowBounds = getMainWindowLaunchBounds(mainWindowState, options.initialNoteLayout);
  const isListLayout = options.initialNoteLayout === NoteLayoutPreference.LIST;

  const mainWindow = new BrowserWindow({
    ...mainWindowBounds,
    minWidth: 335,
    minHeight: 250,
    resizable: !isListLayout,
    maximizable: !isListLayout,
    show: false,
    icon: isMac ? getAppIconPath() : getWindowIconPath(),
    webPreferences: getAppWindowWebPreferences(path.join(__dirname, "../preload/preload.js"))
  });

  if (!isListLayout && mainWindowState.isMaximized) {
    mainWindow.maximize();
  }

  registerRichTextShortcuts(mainWindow);
  blockProductionDevTools(mainWindow);
  registerWindowNavigationGuards(mainWindow, { allowedFilePaths: [getAppIndexFilePath()] });
  options.lockStateService.registerMainWindow(mainWindow);

  let hasShownMainWindow = false;
  let fallbackShowTimeout: NodeJS.Timeout | undefined;
  const showMainWindow = () => {
    if (hasShownMainWindow || mainWindow.isDestroyed()) {
      return;
    }

    hasShownMainWindow = true;
    if (fallbackShowTimeout) {
      clearTimeout(fallbackShowTimeout);
    }

    mainWindow.show();

    if (options.splashWindow && !options.splashWindow.isDestroyed()) {
      options.splashWindow.close();
    }
  };
  const handleMainWindowReadyToShow = (event: IpcMainEvent) => {
    if (event.sender === mainWindow.webContents) {
      showMainWindow();
    }
  };

  ipcMain.on(channels.appWindow.readyToShow, handleMainWindowReadyToShow);

  mainWindow.once("ready-to-show", () => {
    fallbackShowTimeout = setTimeout(showMainWindow, 10000);
  });

  mainWindow.on("close", () => {
    saveMainWindowStateOnClose(mainWindow, options.mainWindowStateFilePath);
  });

  mainWindow.on("closed", () => {
    if (fallbackShowTimeout) {
      clearTimeout(fallbackShowTimeout);
    }

    ipcMain.removeListener(channels.appWindow.readyToShow, handleMainWindowReadyToShow);
  });

  if (isDev) {
    mainWindow.loadURL(dev("main", options.lockStateService.getIsLocked() ? "/lock" : ""));
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(...production("main", options.lockStateService.getIsLocked() ? "/lock" : ""));
  }

  return mainWindow;
}
