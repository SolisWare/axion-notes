/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "./NoteType";

type SetNoteEvent = {
  type: "setNote";
  note: NoteType;
};

type SetNoteOrderEvent = {
  type: "setNoteOrder";
  noteIds: string[];
};

type DeleteNoteEvent = {
  type: "deleteNote";
  noteId: string;
};

type DeleteAllNotesEvent = {
  type: "deleteAllNotes";
};

export type NotesChangeEvent =
  | SetNoteEvent
  | SetNoteOrderEvent
  | DeleteNoteEvent
  | DeleteAllNotesEvent;
