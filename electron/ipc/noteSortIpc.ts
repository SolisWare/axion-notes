/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow } from "electron";
import { LockStateService } from "../security/LockStateService";
import { channels } from "./channels";
import { protectedOn } from "./protectedIpc";

type NoteSortIpcOptions = {
  lockStateService: LockStateService;
};

export function registerNoteSortIpc(options: NoteSortIpcOptions): void {
  protectedOn(channels.noteSort.requestSort, options, () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(channels.noteSort.onSortRequest);
    });
  });
}
