/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { channels } from "../ipc/channels";
import { OpenNoteWindowOptions } from "../../src/models/OpenNoteWindowOptions";
import { off, on, send } from "./ipcHelpers";

export const noteWindowApi = {
  open: (noteId: string, options?: OpenNoteWindowOptions) => {
    send(channels.noteWindow.open, noteId, options);
  },
  onClosed: (callback: (noteId: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, noteId: string) => callback(noteId);
    on(channels.noteWindow.closed, listener);

    return () => {
      off(channels.noteWindow.closed, listener);
    };
  }
};
