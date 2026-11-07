/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../types/NoteType";
import { RestoreNotesMode } from "../types/RestoreNotesMode";
import { ValidatedBackupArchive } from "./restoreArchive";

export type RestoreNotesResult = {
  notes: NoteType[];
  restoredNotesCount: number;
  skippedIdenticalNotesCount: number;
};

/**
 * Produces the note collection resulting from the selected restore mode without writing storage.
 */
export function prepareRestoredNotes(
  archive: ValidatedBackupArchive,
  currentNotes: readonly NoteType[],
  mode: RestoreNotesMode,
  createNoteId: () => string
): RestoreNotesResult {
  const orderedBackupNotes = orderNotes(archive.notes, archive.noteOrder);

  if (mode === RestoreNotesMode.REPLACE_CURRENT) {
    return {
      notes: orderedBackupNotes,
      restoredNotesCount: orderedBackupNotes.length,
      skippedIdenticalNotesCount: 0
    };
  }

  return addBackupNotes(orderedBackupNotes, currentNotes, createNoteId);
}

function addBackupNotes(incomingNotes: readonly NoteType[], currentNotes: readonly NoteType[], createNoteId: () => string): RestoreNotesResult {
  const existingNotesById = new Map(currentNotes.map((note) => [note.id, note]));
  const usedNoteIds = new Set(existingNotesById.keys());
  const importedNotes: NoteType[] = [];
  const remappedIds = new Map<string, string>();
  let skippedIdenticalNotesCount = 0;

  for (const incomingNote of incomingNotes) {
    const currentNote = existingNotesById.get(incomingNote.id);

    if (currentNote && areNotesEqual(currentNote, incomingNote)) {
      skippedIdenticalNotesCount += 1;
      continue;
    }

    const restoredNote = currentNote
      ? { ...incomingNote, id: getUniqueNoteId(usedNoteIds, createNoteId) }
      : { ...incomingNote };

    if (restoredNote.id !== incomingNote.id) {
      remappedIds.set(incomingNote.id, restoredNote.id);
    }

    usedNoteIds.add(restoredNote.id);
    importedNotes.push(restoredNote);
  }

  return {
    notes: [...currentNotes, ...remapPinnedNoteReferences(importedNotes, remappedIds)],
    restoredNotesCount: importedNotes.length,
    skippedIdenticalNotesCount
  };
}

function orderNotes(notes: readonly NoteType[], noteOrder: readonly string[]): NoteType[] {
  const notesById = new Map(notes.map((note) => [note.id, note]));
  return noteOrder.map((noteId) => {
    const note = notesById.get(noteId);

    if (!note) {
      throw new Error(`Backup archive order references missing note: ${noteId}`);
    }

    return { ...note };
  });
}

function remapPinnedNoteReferences(notes: readonly NoteType[], remappedIds: ReadonlyMap<string, string>): NoteType[] {
  return notes.map((note) => {
    if (!note.pinnedFromNoteIds) {
      return note;
    }

    return {
      ...note,
      pinnedFromNoteIds: note.pinnedFromNoteIds.map((noteId) => remappedIds.get(noteId) ?? noteId)
    };
  });
}

function getUniqueNoteId(usedNoteIds: ReadonlySet<string>, createNoteId: () => string): string {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const noteId = createNoteId();

    if (!usedNoteIds.has(noteId)) {
      return noteId;
    }
  }

  throw new Error("Could not create a unique note ID for the restored note.");
}

function areNotesEqual(first: NoteType, second: NoteType): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}
