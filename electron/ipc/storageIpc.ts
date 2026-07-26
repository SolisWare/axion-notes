/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { NoteAccessStatus } from "../../src/models/NoteAccessStatus";
import { NoteType } from "../../src/models/NoteType";
import { NotesChangeEvent } from "../../src/models/NotesChangeEvent";
import { NotesWithAccessState } from "../../src/models/NotesWithAccessState";
import { channels } from "./channels";
import { LockStateService } from "../security/LockStateService";
import { NoteService } from "../storage/NoteService";

type StorageIpcOptions = {
  appDataDir: string;
  lockStateService: LockStateService;
  noteService: NoteService;
};

function broadcastNotesChange(event: NotesChangeEvent): void {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(channels.storage.onNotesChange, event);
  });
}

export function registerStorageIpc(options: StorageIpcOptions): void {
  ipcMain.on(channels.storage.setNote, (_, note: NoteType) => {
    if (options.lockStateService.getIsLocked()) {
      return;
    }

    options.noteService.setNote(note);
    broadcastNotesChange({
      type: "setNote",
      note
    });
  });

  ipcMain.on(channels.storage.setNoteOrder, (_, noteIds: string[]) => {
    if (options.lockStateService.getIsLocked()) {
      return;
    }

    options.noteService.setNoteOrder(noteIds);
    broadcastNotesChange({
      type: "setNoteOrder",
      noteIds
    });
  });

  ipcMain.handle(channels.storage.getNotes, async () => {
    if (options.lockStateService.getIsLocked()) {
      return [];
    }

    return options.noteService.getNotes();
  });

  ipcMain.handle(channels.storage.getNotesWithAccessState, async (): Promise<NotesWithAccessState> => {
    if (options.lockStateService.getIsLocked()) {
      return {
        status: NoteAccessStatus.LOCKED,
        notes: []
      };
    }

    return {
      status: NoteAccessStatus.AVAILABLE,
      notes: await options.noteService.getNotes()
    };
  });

  ipcMain.handle(channels.storage.getNotesFolderLocation, () => {
    return options.appDataDir;
  });

  ipcMain.on(channels.storage.deleteNote, (_, noteId: string) => {
    if (options.lockStateService.getIsLocked()) {
      return;
    }

    options.noteService.deleteNote(noteId);
    broadcastNotesChange({
      type: "deleteNote",
      noteId
    });
  });

  ipcMain.on(channels.storage.deleteAllNotes, () => {
    if (options.lockStateService.getIsLocked()) {
      return;
    }

    options.noteService.deleteAllNotes();
    broadcastNotesChange({
      type: "deleteAllNotes"
    });
  });
}
