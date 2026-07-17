/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../../models/NoteType";
import { NotesChangeEvent } from "../../models/NotesChangeEvent";
import i18n from "../../i18n/i18n";
import { deleteAllNotes, deleteNote, getNotes, setNote, setNoteOrder } from "./noteStorage";

type NotesChangeListener = (event: NotesChangeEvent) => void;

const notesChangeListeners = new Set<NotesChangeListener>();

function notifyNotesChange(event: NotesChangeEvent): void {
  notesChangeListeners.forEach((listener) => {
    listener(event);
  });
}

export const storageApi = {

  setNote: (note: NoteType) => {
    try {
      setNote(note);
      notifyNotesChange({
        type: "setNote",
        note
      });
    } catch (err) {
      console.error("Failed to save browser note:", err);
    }
  },

  setNoteOrder: (noteIds: string[]) => {
    try {
      setNoteOrder(noteIds);
      notifyNotesChange({
        type: "setNoteOrder",
        noteIds
      });
    } catch (err) {
      console.error("Failed to save browser note order:", err);
    }
  },

  getNotes: async (): Promise<NoteType[]> => {
    try {
      return await getNotes();
    } catch (err) {
      console.error("Failed to load browser notes:", err);
      return [];
    }
  },

  getNotesFolderLocation: async (): Promise<string> => {
    return i18n.t("settingsWindow.dataStorage.browserLocalStorage");
  },

  deleteNote: (noteId: string) => {
    try {
      deleteNote(noteId);
      notifyNotesChange({
        type: "deleteNote",
        noteId
      });
    } catch (err) {
      console.error("Failed to delete browser note:", err);
    }
  },

  deleteAllNotes: () => {
    try {
      deleteAllNotes();
      notifyNotesChange({
        type: "deleteAllNotes"
      });
    } catch (err) {
      console.error("Failed to delete all browser notes:", err);
    }
  },

  onNotesChange: (callback: NotesChangeListener) => {
    notesChangeListeners.add(callback);

    return () => {
      notesChangeListeners.delete(callback);
    };
  }
};
