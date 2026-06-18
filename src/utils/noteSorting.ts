/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../models/NoteType";
import { NoteSortOrder } from "../settings/NoteSortOrder";

export function sortNotes(notes: NoteType[], notesSortOrder: NoteSortOrder): NoteType[] {
  return notes
    .map((note, index) => ({ note, index }))
    .sort((first, second) => {
      const sortResult = compareNotes(first.note, second.note, notesSortOrder);

      return sortResult === 0 ? first.index - second.index : sortResult;
    })
    .map(({ note }) => note);
}

export function insertNoteBySortOrder(notes: NoteType[], note: NoteType, notesSortOrder: NoteSortOrder): NoteType[] {
  const insertionIndex = notes.findIndex((existingNote) => compareNotes(note, existingNote, notesSortOrder) < 0);

  if (insertionIndex === -1) {
    return [...notes, note];
  }

  return [
    ...notes.slice(0, insertionIndex),
    note,
    ...notes.slice(insertionIndex)
  ];
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
