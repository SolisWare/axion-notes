/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { LockStateService } from "../security/LockStateService";
import { channels } from "./channels";

type NoteSortIpcOptions = {
  lockStateService: LockStateService;
};

export function registerNoteSortIpc(options: NoteSortIpcOptions): void {
  ipcMain.on(channels.noteSort.requestSort, () => {
    if (options.lockStateService.getIsLocked()) {
      return;
    }

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(channels.noteSort.onSortRequest);
    });
  });
}
