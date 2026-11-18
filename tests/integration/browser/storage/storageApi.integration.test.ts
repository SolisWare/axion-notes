/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { replaceBrowserNotes, storageApi } from "../../../../src/browser/storage/storageApi";
import { NoteAccessStatus } from "../../../../src/types/NoteAccessStatus";
import { NoteType } from "../../../../src/types/NoteType";
import { NoteColorKey } from "../../../../src/theme/NoteColors";

afterEach(() => {
  localStorage.clear();
});

describe("browser storage API integration", () => {
  it("persists note operations and emits the matching change events", async () => {
    const firstNote = createNote("note-1", "First");
    const secondNote = createNote("note-2", "Second");
    const listener = vi.fn();
    const unsubscribe = storageApi.onNotesChange(listener);

    storageApi.setNote(firstNote);
    storageApi.setNote(secondNote);
    storageApi.setNoteOrder([secondNote.id, firstNote.id]);
    storageApi.deleteNote(secondNote.id);
    storageApi.deleteAllNotes();
    unsubscribe();
    storageApi.setNote(firstNote);

    expect(listener).toHaveBeenNthCalledWith(1, { type: "setNote", note: firstNote });
    expect(listener).toHaveBeenNthCalledWith(2, { type: "setNote", note: secondNote });
    expect(listener).toHaveBeenNthCalledWith(3, { type: "setNoteOrder", noteIds: [secondNote.id, firstNote.id] });
    expect(listener).toHaveBeenNthCalledWith(4, { type: "deleteNote", noteId: secondNote.id });
    expect(listener).toHaveBeenNthCalledWith(5, { type: "deleteAllNotes" });
    expect(listener).toHaveBeenCalledTimes(5);
    await expect(storageApi.getNotes()).resolves.toEqual([firstNote]);
  });

  it("replaces notes through the storage layer and reports available access", async () => {
    const notes = [createNote("note-1", "First"), createNote("note-2", "Second")];
    const listener = vi.fn();
    const unsubscribe = storageApi.onNotesChange(listener);

    replaceBrowserNotes(notes);

    await expect(storageApi.getNotesWithAccessState()).resolves.toEqual({
      status: NoteAccessStatus.AVAILABLE,
      notes
    });
    expect(listener).toHaveBeenNthCalledWith(1, { type: "deleteAllNotes" });
    expect(listener).toHaveBeenNthCalledWith(2, { type: "setNote", note: notes[0] });
    expect(listener).toHaveBeenNthCalledWith(3, { type: "setNote", note: notes[1] });
    expect(listener).toHaveBeenNthCalledWith(4, { type: "setNoteOrder", noteIds: notes.map((note) => note.id) });
    unsubscribe();
  });
});

function createNote(id: string, title: string): NoteType {
  const createdOn = new Date("2026-11-18T12:00:00.000Z");

  return {
    id,
    bgcolor: NoteColorKey.YELLOW,
    content: `${title} content`,
    createdOn,
    lastModifiedOn: createdOn,
    title
  };
}
