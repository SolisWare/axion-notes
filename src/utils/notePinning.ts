/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../models/NoteType";
import { NoteSortOrder } from "../settings/NoteSortOrder";
import { isPinnedNote, sortNotes } from "./noteSorting";

export { isPinnedNote } from "./noteSorting";

export function getNotesWithPinnedNote(notes: NoteType[], noteToPin: NoteType): NoteType[] {
  const pinnedNote = {
    ...noteToPin,
    isPinned: true,
    pinnedOn: new Date(),
    pinnedFromNoteIds: notes.map((note) => note.id)
  };
  const notesWithoutPinnedNote = notes.filter((note) => note.id !== noteToPin.id);
  const lastPinnedNoteIndex = notesWithoutPinnedNote.reduce((lastPinnedIndex, note, index) => {
    return isPinnedNote(note) ? index : lastPinnedIndex;
  }, -1);
  const nextNotes = [...notesWithoutPinnedNote];

  nextNotes.splice(lastPinnedNoteIndex + 1, 0, pinnedNote);

  return nextNotes;
}

export function getNotesWithUnpinnedNote(notes: NoteType[], noteToUnpin: NoteType, notesSortOrder: NoteSortOrder): NoteType[] {
  const noteIndex = notes.findIndex((note) => note.id === noteToUnpin.id);

  if (noteIndex < 0) {
    return sortNotes([...notes, getUnpinnedNote(noteToUnpin)], notesSortOrder);
  }

  const unpinnedNote = getUnpinnedNote(noteToUnpin);
  const notesWithoutUnpinnedNote = notes.filter((note) => note.id !== noteToUnpin.id);
  const pinnedNotes = notesWithoutUnpinnedNote.filter(isPinnedNote);
  const unpinnedNotes = notesWithoutUnpinnedNote.filter((note) => !isPinnedNote(note));
  const unpinnedInsertionIndex = notesSortOrder === NoteSortOrder.CUSTOM
    ? getCustomOrderUnpinIndex(notes, noteIndex, unpinnedNotes)
    : getSortedOrderUnpinIndex(unpinnedNotes, unpinnedNote, notesSortOrder);

  return [
    ...pinnedNotes,
    ...unpinnedNotes.slice(0, unpinnedInsertionIndex),
    unpinnedNote,
    ...unpinnedNotes.slice(unpinnedInsertionIndex)
  ];
}

function getUnpinnedNote(note: NoteType): NoteType {
  return {
    ...note,
    isPinned: false,
    pinnedOn: undefined,
    pinnedFromNoteIds: undefined
  };
}

function getCustomOrderUnpinIndex(notes: NoteType[], noteIndex: number, unpinnedNotes: NoteType[]): number {
  const pinnedFromNoteIds = notes[noteIndex].pinnedFromNoteIds;

  if (pinnedFromNoteIds) {
    const previousPinnedOrderNoteId = getPreviousExistingUnpinnedNoteId(pinnedFromNoteIds, notes[noteIndex].id, unpinnedNotes);

    if (previousPinnedOrderNoteId) {
      const previousUnpinnedIndex = unpinnedNotes.findIndex((note) => note.id === previousPinnedOrderNoteId);

      return previousUnpinnedIndex + 1;
    }

    const nextPinnedOrderNoteId = getNextExistingUnpinnedNoteId(pinnedFromNoteIds, notes[noteIndex].id, unpinnedNotes);

    if (nextPinnedOrderNoteId) {
      return unpinnedNotes.findIndex((note) => note.id === nextPinnedOrderNoteId);
    }
  }

  for (let index = noteIndex - 1; index >= 0; index--) {
    const previousNote = notes[index];

    if (!isPinnedNote(previousNote)) {
      const previousUnpinnedIndex = unpinnedNotes.findIndex((note) => note.id === previousNote.id);

      return previousUnpinnedIndex < 0 ? 0 : previousUnpinnedIndex + 1;
    }
  }

  for (let index = noteIndex + 1; index < notes.length; index++) {
    const nextNote = notes[index];

    if (!isPinnedNote(nextNote)) {
      const nextUnpinnedIndex = unpinnedNotes.findIndex((note) => note.id === nextNote.id);

      return nextUnpinnedIndex < 0 ? 0 : nextUnpinnedIndex;
    }
  }

  return 0;
}

function getPreviousExistingUnpinnedNoteId(noteIds: string[], noteId: string, unpinnedNotes: NoteType[]): string | undefined {
  const noteIndex = noteIds.indexOf(noteId);

  if (noteIndex < 0) {
    return undefined;
  }

  for (let index = noteIndex - 1; index >= 0; index--) {
    const previousNoteId = noteIds[index];

    if (unpinnedNotes.some((note) => note.id === previousNoteId)) {
      return previousNoteId;
    }
  }

  return undefined;
}

function getNextExistingUnpinnedNoteId(noteIds: string[], noteId: string, unpinnedNotes: NoteType[]): string | undefined {
  const noteIndex = noteIds.indexOf(noteId);

  if (noteIndex < 0) {
    return undefined;
  }

  for (let index = noteIndex + 1; index < noteIds.length; index++) {
    const nextNoteId = noteIds[index];

    if (unpinnedNotes.some((note) => note.id === nextNoteId)) {
      return nextNoteId;
    }
  }

  return undefined;
}

function getSortedOrderUnpinIndex(unpinnedNotes: NoteType[], unpinnedNote: NoteType, notesSortOrder: NoteSortOrder): number {
  const sortedUnpinnedNotes = sortNotes([...unpinnedNotes, unpinnedNote], notesSortOrder);
  const sortedUnpinnedNoteIndex = sortedUnpinnedNotes.findIndex((note) => note.id === unpinnedNote.id);

  for (let index = sortedUnpinnedNoteIndex - 1; index >= 0; index--) {
    const previousNote = sortedUnpinnedNotes[index];
    const previousUnpinnedIndex = unpinnedNotes.findIndex((note) => note.id === previousNote.id);

    if (previousUnpinnedIndex >= 0) {
      return previousUnpinnedIndex + 1;
    }
  }

  for (let index = sortedUnpinnedNoteIndex + 1; index < sortedUnpinnedNotes.length; index++) {
    const nextNote = sortedUnpinnedNotes[index];
    const nextUnpinnedIndex = unpinnedNotes.findIndex((note) => note.id === nextNote.id);

    if (nextUnpinnedIndex >= 0) {
      return nextUnpinnedIndex;
    }
  }

  return sortedUnpinnedNoteIndex >= sortedUnpinnedNotes.length - 1 ? unpinnedNotes.length : 0;
}
