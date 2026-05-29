/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ipcMain } from "electron";
import { NoteType } from "../../src/models/NoteType";
import { channels } from "./channels";
import { deleteAllNotes, deleteNote, getNotes, setNote } from "../storage/noteStorage";

type StorageIpcOptions = {
  appDataDir: string;
};

export function registerStorageIpc(options: StorageIpcOptions): void {
  ipcMain.on(channels.storage.setNote, (_, note: NoteType) => {
    setNote(options.appDataDir, note);
  });

  ipcMain.handle(channels.storage.getNotes, async () => {
    return getNotes(options.appDataDir);
  });

  ipcMain.handle(channels.storage.getNotesFolderLocation, () => {
    return options.appDataDir;
  });

  ipcMain.on(channels.storage.deleteNote, (_, noteId: string) => {
    deleteNote(options.appDataDir, noteId);
  });

  ipcMain.on(channels.storage.deleteAllNotes, () => {
    deleteAllNotes(options.appDataDir);
  });
}
