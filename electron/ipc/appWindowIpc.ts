/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app, BrowserWindow, ipcMain } from "electron";
import { NoteLayoutPreference } from "../../src/settings/NoteLayoutPreference";
import { LockStateService } from "../security/LockStateService";
import { SettingsService } from "../storage/SettingsService";
import { applyMainWindowLayout, suppressMainWindowStateSaveOnClose } from "../windows/mainWindowState";
import { AppRestartOptions } from "../../src/types/AppRestartOptions";
import { channels } from "./channels";
import { protectedOn } from "./protectedIpc";

type AppWindowIpcOptions = {
  lockStateService: LockStateService;
  mainWindowStateFilePath: string;
  settingsService: SettingsService;
};

export function registerAppWindowIpc(options: AppWindowIpcOptions): void {
  ipcMain.on(channels.appWindow.close, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  protectedOn<[AppRestartOptions?]>(channels.appWindow.restart, options, async (event, restartOptions) => {
    await options.settingsService.waitForPendingSettingsWrite();

    if (restartOptions?.preserveMainWindowState) {
      BrowserWindow.getAllWindows().forEach((window) => suppressMainWindowStateSaveOnClose(window));
    }

    app.relaunch();
    app.exit(0);
  });

  protectedOn<[boolean]>(channels.appWindow.setAlwaysOnTop, options, (event, enabled) => {
    BrowserWindow.fromWebContents(event.sender)?.setAlwaysOnTop(enabled);
  });

  protectedOn<[NoteLayoutPreference]>(channels.appWindow.setLayout, options, (event, layout) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window || !isNoteLayoutPreference(layout)) {
      return;
    }

    applyMainWindowLayout(window, options.mainWindowStateFilePath, layout);
  });
}

function isNoteLayoutPreference(layout: unknown): layout is NoteLayoutPreference {
  return layout === NoteLayoutPreference.GRID || layout === NoteLayoutPreference.LIST;
}
