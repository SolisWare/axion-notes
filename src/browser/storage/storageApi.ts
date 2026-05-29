/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../../models/NoteType";
import { deleteAllNotes, deleteNote, getNotes, setNote } from "./noteStorage";

export const storageApi = {

  setNote: (note: NoteType) => {
    try {
      setNote(note);
    } catch (err) {
      console.error("Failed to save browser note:", err);
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
    return "Browser local storage";
  },

  deleteNote: (noteId: string) => {
    try {
      deleteNote(noteId);
    } catch (err) {
      console.error("Failed to delete browser note:", err);
    }
  },

  deleteAllNotes: () => {
    try {
      deleteAllNotes();
    } catch (err) {
      console.error("Failed to delete all browser notes:", err);
    }
  }
};
