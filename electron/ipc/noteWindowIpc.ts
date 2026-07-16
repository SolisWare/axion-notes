/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ipcMain } from "electron";
import { createNoteWindow } from "../windows/createNoteWindow";
import { channels } from "./channels";

export function registerNoteWindowIpc(): void {
  ipcMain.on(channels.noteWindow.open, (_, noteId: string) => {
    createNoteWindow(noteId);
  });
}
