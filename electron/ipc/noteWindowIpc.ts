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

export function registerNoteWindowIpc(): void {
  ipcMain.on(channels.noteWindow.open, (event, noteId: string, options?: OpenNoteWindowOptions) => {
    createNoteWindow({
      noteId,
      openerWindow: options?.offsetFromCurrentWindow ? BrowserWindow.fromWebContents(event.sender) ?? undefined : undefined
    });
  });
}
