/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { NoteLayoutPreference } from "../../src/settings/NoteLayoutPreference";
import { applyMainWindowLayout } from "../windows/mainWindowState";
import { channels } from "./channels";

type AppWindowIpcOptions = {
  mainWindowStateFilePath: string;
};

export function registerAppWindowIpc(options: AppWindowIpcOptions): void {
  ipcMain.on(channels.appWindow.close, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });

  ipcMain.on(channels.appWindow.setAlwaysOnTop, (event, enabled: boolean) => {
    BrowserWindow.fromWebContents(event.sender)?.setAlwaysOnTop(enabled);
  });

  ipcMain.on(channels.appWindow.setLayout, (event, layout: NoteLayoutPreference) => {
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
