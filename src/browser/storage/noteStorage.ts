/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../../models/NoteType";

const noteIndexKey = "solisware.axion-notes.notes.index";
const noteKeyPrefix = "solisware.axion-notes.notes";

function getNoteKey(noteId: string): string {
  return `${noteKeyPrefix}.${noteId}`;
}

function readNoteIds(): string[] {
  const serializedNoteIds = localStorage.getItem(noteIndexKey);

  if (!serializedNoteIds) {
    return [];
  }

  try {
    const noteIds = JSON.parse(serializedNoteIds);

    return Array.isArray(noteIds) ? noteIds.filter((noteId): noteId is string => typeof noteId === "string") : [];
  } catch (err) {
    console.warn("Failed to load browser note index:", err);
    return [];
  }
}

function writeNoteIds(noteIds: string[]): void {
  localStorage.setItem(noteIndexKey, JSON.stringify(noteIds));
}

function readNote(noteId: string): NoteType | null {
  const serializedNote = localStorage.getItem(getNoteKey(noteId));

  if (!serializedNote) {
    return null;
  }

  try {
    const parsed = JSON.parse(serializedNote) as NoteType;

    return {
      ...parsed,
      createdOn: new Date(parsed.createdOn),
      lastModifiedOn: new Date(parsed.lastModifiedOn)
    };
  } catch (err) {
    console.warn(`Skipping corrupt browser note: ${noteId}`, err);
    return null;
  }
}

export function setNote(note: NoteType): void {
  const noteIds = readNoteIds();

  localStorage.setItem(getNoteKey(note.id), JSON.stringify(note));

  if (!noteIds.includes(note.id)) {
    writeNoteIds([...noteIds, note.id]);
  }
}

export async function getNotes(): Promise<NoteType[]> {
  return readNoteIds()
    .map(readNote)
    .filter((note): note is NoteType => note !== null)
    .sort((oldestNote, latestNote) => oldestNote.createdOn.getTime() - latestNote.createdOn.getTime());
}

export function deleteNote(noteId: string): void {
  localStorage.removeItem(getNoteKey(noteId));
  writeNoteIds(readNoteIds().filter((storedNoteId) => storedNoteId !== noteId));
}

export function deleteAllNotes(): void {
  readNoteIds().forEach((noteId) => {
    localStorage.removeItem(getNoteKey(noteId));
  });
  localStorage.removeItem(noteIndexKey);
}
