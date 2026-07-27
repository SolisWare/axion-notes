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
import { protectedHandle, protectedOn } from "./protectedIpc";

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
  protectedOn<[NoteType]>(channels.storage.setNote, options, (_, note) => {
    options.noteService.setNote(note);
    broadcastNotesChange({
      type: "setNote",
      note
    });
  });

  protectedOn<[string[]]>(channels.storage.setNoteOrder, options, (_, noteIds) => {
    options.noteService.setNoteOrder(noteIds);
    broadcastNotesChange({
      type: "setNoteOrder",
      noteIds
    });
  });

  protectedHandle<NoteType[], []>(channels.storage.getNotes, { ...options, fallback: [] }, async () => {
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

  protectedHandle<string, []>(channels.storage.getNotesFolderLocation, { ...options, fallback: "" }, () => {
    return options.appDataDir;
  });

  protectedOn<[string]>(channels.storage.deleteNote, options, (_, noteId) => {
    options.noteService.deleteNote(noteId);
    broadcastNotesChange({
      type: "deleteNote",
      noteId
    });
  });

  protectedOn(channels.storage.deleteAllNotes, options, () => {
    options.noteService.deleteAllNotes();
    broadcastNotesChange({
      type: "deleteAllNotes"
    });
  });
}
