/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { NoteType } from "../../src/models/NoteType";
import { NotesChangeEvent } from "../../src/models/NotesChangeEvent";
import { channels } from "./channels";
import { deleteAllNotes, deleteNote, getNotes, setNote, setNoteOrder } from "../storage/noteStorage";

type StorageIpcOptions = {
  appDataDir: string;
};

function broadcastNotesChange(event: NotesChangeEvent): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channels.storage.onNotesChange, event);
  });
}

export function registerStorageIpc(options: StorageIpcOptions): void {
  ipcMain.on(channels.storage.setNote, (_, note: NoteType) => {
    setNote(options.appDataDir, note);
    broadcastNotesChange({
      type: "setNote",
      note
    });
  });

  ipcMain.on(channels.storage.setNoteOrder, (_, noteIds: string[]) => {
    setNoteOrder(options.appDataDir, noteIds);
    broadcastNotesChange({
      type: "setNoteOrder",
      noteIds
    });
  });

  ipcMain.handle(channels.storage.getNotes, async () => {
    return getNotes(options.appDataDir);
  });

  ipcMain.handle(channels.storage.getNotesFolderLocation, () => {
    return options.appDataDir;
  });

  ipcMain.on(channels.storage.deleteNote, (_, noteId: string) => {
    deleteNote(options.appDataDir, noteId);
    broadcastNotesChange({
      type: "deleteNote",
      noteId
    });
  });

  ipcMain.on(channels.storage.deleteAllNotes, () => {
    deleteAllNotes(options.appDataDir);
    broadcastNotesChange({
      type: "deleteAllNotes"
    });
  });
}
