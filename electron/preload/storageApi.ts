/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../../src/models/NoteType";
import { channels } from "../ipc/channels";
import { receive, send } from "./ipcHelpers";

export const storageApi = {

  setNote: (note: NoteType) => {
    send(channels.storage.setNote, note);
  },

  getNotes: async (): Promise<NoteType[]> => {
    try {
      const notes = await receive<NoteType[]>(channels.storage.getNotes);
      console.log(`Loaded ${notes.length} notes`);
      return notes;
    } catch (err) {
      console.error('Failed to load notes:', (err as Error).message);
      return [];
    }
  },

  getNotesFolderLocation: async (): Promise<string> => {
    try {
      return await receive<string>(channels.storage.getNotesFolderLocation);
    } catch (err) {
      console.error('Failed to load notes folder location:', (err as Error).message);
      return "";
    }
  },

  deleteNote: (noteId: string) => {
    send(channels.storage.deleteNote, noteId);
  },
  
  deleteAllNotes: () => {
    send(channels.storage.deleteAllNotes);
  }
};
