/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow } from "electron";
import { OpenNoteWindowOptions } from "../../src/models/OpenNoteWindowOptions";
import { createNoteWindow } from "../windows/createNoteWindow";
import { channels } from "./channels";
import { LockStateService } from "../security/LockStateService";
import { protectedOn } from "./protectedIpc";

type NoteWindowIpcOptions = {
  lockStateService: LockStateService;
};

export function registerNoteWindowIpc(options: NoteWindowIpcOptions): void {
  protectedOn<[string, OpenNoteWindowOptions | undefined]>(channels.noteWindow.open, options, (event, noteId, openOptions) => {
    createNoteWindow({
      noteId,
      openerWindow: openOptions?.offsetFromCurrentWindow ? BrowserWindow.fromWebContents(event.sender) ?? undefined : undefined
    });
  });
}
