/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { OpenNoteWindowOptions } from "../../src/models/OpenNoteWindowOptions";
import { createNoteWindow } from "../windows/createNoteWindow";
import { channels } from "./channels";
import { LockStateService } from "../security/LockStateService";

type NoteWindowIpcOptions = {
  lockStateService: LockStateService;
};

export function registerNoteWindowIpc(options: NoteWindowIpcOptions): void {
  ipcMain.on(channels.noteWindow.open, (event, noteId: string, openOptions?: OpenNoteWindowOptions) => {
    if (options.lockStateService.getIsLocked()) {
      return;
    }

    createNoteWindow({
      noteId,
      openerWindow: openOptions?.offsetFromCurrentWindow ? BrowserWindow.fromWebContents(event.sender) ?? undefined : undefined
    });
  });
}
