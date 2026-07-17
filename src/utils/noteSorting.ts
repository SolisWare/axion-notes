/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../models/NoteType";
import { NoteSortOrder } from "../settings/NoteSortOrder";

export function sortNotes(notes: NoteType[], notesSortOrder: NoteSortOrder): NoteType[] {
  if (notesSortOrder === NoteSortOrder.CUSTOM) {
    return getPinnedNotesFirst(notes);
  }

  const pinnedNotes = notes.filter(isPinnedNote);
  const unpinnedNotes = notes.filter((note) => !isPinnedNote(note));

  return [
    ...pinnedNotes,
    ...sortNotesByOrder(unpinnedNotes, notesSortOrder)
  ];
}

export function insertUnpinnedNote(notes: NoteType[], noteToUnpin: NoteType, notesSortOrder: NoteSortOrder): NoteType[] {
  const noteIndex = notes.findIndex((note) => note.id === noteToUnpin.id);

  if (noteIndex < 0) {
    return sortNotes([...notes, noteToUnpin], notesSortOrder);
  }

  const unpinnedNote = {
    ...noteToUnpin,
    isPinned: false,
    pinnedOn: undefined,
    pinnedFromNoteIds: undefined
  };
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

export function isPinnedNote(note: NoteType): boolean {
  return note.isPinned === true;
}

function getPinnedNotesFirst(notes: NoteType[]): NoteType[] {
  return [
    ...notes.filter(isPinnedNote),
    ...notes.filter((note) => !isPinnedNote(note))
  ];
}

function sortNotesByOrder(notes: NoteType[], notesSortOrder: NoteSortOrder): NoteType[] {
  return notes
    .map((note, index) => ({ note, index }))
    .sort((first, second) => {
      const sortResult = compareNotes(first.note, second.note, notesSortOrder);

      return sortResult === 0 ? first.index - second.index : sortResult;
    })
    .map(({ note }) => note);
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
  const sortedUnpinnedNotes = sortNotesByOrder([...unpinnedNotes, unpinnedNote], notesSortOrder);
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

function compareNotes(firstNote: NoteType, secondNote: NoteType, notesSortOrder: NoteSortOrder): number {
  switch (notesSortOrder) {
    case NoteSortOrder.TITLE_ASC:
      return getNoteTitle(firstNote).localeCompare(getNoteTitle(secondNote), undefined, { sensitivity: "base" });
    case NoteSortOrder.TITLE_DESC:
      return getNoteTitle(secondNote).localeCompare(getNoteTitle(firstNote), undefined, { sensitivity: "base" });
    case NoteSortOrder.LAST_MODIFIED:
      return secondNote.lastModifiedOn.getTime() - firstNote.lastModifiedOn.getTime();
    case NoteSortOrder.DATE_CREATED_DESC:
      return secondNote.createdOn.getTime() - firstNote.createdOn.getTime();
    case NoteSortOrder.DATE_CREATED_ASC:
    default:
      return firstNote.createdOn.getTime() - secondNote.createdOn.getTime();
  }
}

function getNoteTitle(note: NoteType): string {
  return note.title?.trim() || note.content.trim();
}
