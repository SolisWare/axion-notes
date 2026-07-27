/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { NoteLayoutPreference } from "../../src/settings/NoteLayoutPreference";
import { LockStateService } from "../security/LockStateService";
import { applyMainWindowLayout } from "../windows/mainWindowState";
import { channels } from "./channels";
import { protectedOn } from "./protectedIpc";

type AppWindowIpcOptions = {
  lockStateService: LockStateService;
  mainWindowStateFilePath: string;
};

export function registerAppWindowIpc(options: AppWindowIpcOptions): void {
  ipcMain.on(channels.appWindow.close, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
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
