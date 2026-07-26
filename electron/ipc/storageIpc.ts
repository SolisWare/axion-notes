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
import { NoteService } from "../storage/NoteService";

type StorageIpcOptions = {
  appDataDir: string;
  noteService: NoteService;
};

function broadcastNotesChange(event: NotesChangeEvent): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channels.storage.onNotesChange, event);
  });
}

export function registerStorageIpc(options: StorageIpcOptions): void {
  ipcMain.on(channels.storage.setNote, (_, note: NoteType) => {
    options.noteService.setNote(note);
    broadcastNotesChange({
      type: "setNote",
      note
    });
  });

  ipcMain.on(channels.storage.setNoteOrder, (_, noteIds: string[]) => {
    options.noteService.setNoteOrder(noteIds);
    broadcastNotesChange({
      type: "setNoteOrder",
      noteIds
    });
  });

  ipcMain.handle(channels.storage.getNotes, async () => {
    return options.noteService.getNotes();
  });

  ipcMain.handle(channels.storage.getNotesFolderLocation, () => {
    return options.appDataDir;
  });

  ipcMain.on(channels.storage.deleteNote, (_, noteId: string) => {
    options.noteService.deleteNote(noteId);
    broadcastNotesChange({
      type: "deleteNote",
      noteId
    });
  });

  ipcMain.on(channels.storage.deleteAllNotes, () => {
    options.noteService.deleteAllNotes();
    broadcastNotesChange({
      type: "deleteAllNotes"
    });
  });
}
