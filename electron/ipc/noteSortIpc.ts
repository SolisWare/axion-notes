/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { channels } from "./channels";

export function registerNoteSortIpc(): void {
  ipcMain.on(channels.noteSort.requestSort, () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(channels.noteSort.onSortRequest);
    });
  });
}
