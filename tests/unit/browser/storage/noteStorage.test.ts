/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteAllNotes, deleteNote, getNotes, setNote, setNoteOrder } from "../../../../src/browser/storage/noteStorage";
import { NoteType } from "../../../../src/types/NoteType";
import { NoteColorKey } from "../../../../src/theme/NoteColors";

const noteIndexKey = "solisware.axion-notes.notes.index";
const noteKeyPrefix = "solisware.axion-notes.notes";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("browser note storage", () => {
  it("stores new notes, updates existing notes, and restores date values", async () => {
    const initialNote = createNote("note-1", "Initial title");
    const updatedNote = {
      ...initialNote,
      lastModifiedOn: new Date("2026-11-18T12:30:00.000Z"),
      pinnedOn: new Date("2026-11-18T12:15:00.000Z"),
      title: "Updated title"
    };

    setNote(initialNote);
    setNote(updatedNote);

    expect(JSON.parse(localStorage.getItem(noteIndexKey) ?? "")).toEqual(["note-1"]);
    await expect(getNotes()).resolves.toEqual([updatedNote]);
  });

  it("uses the saved note order and ignores missing records", async () => {
    const firstNote = createNote("note-1", "First");
    const secondNote = createNote("note-2", "Second");
    setNote(firstNote);
    setNote(secondNote);

    setNoteOrder(["note-2", "missing-note", "note-1"]);

    await expect(getNotes()).resolves.toEqual([secondNote, firstNote]);
  });

  it("skips corrupt note records without hiding valid notes", async () => {
    const validNote = createNote("valid-note", "Valid");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    setNote(validNote);
    localStorage.setItem(`${noteKeyPrefix}.corrupt-note`, "not JSON");
    setNoteOrder(["valid-note", "corrupt-note"]);

    await expect(getNotes()).resolves.toEqual([validNote]);
    expect(warning).toHaveBeenCalledWith("Skipping corrupt browser note: corrupt-note", expect.any(SyntaxError));
  });

  it("returns no notes when the stored index is corrupt", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    localStorage.setItem(noteIndexKey, "not JSON");

    await expect(getNotes()).resolves.toEqual([]);
    expect(warning).toHaveBeenCalledWith("Failed to load browser note index:", expect.any(SyntaxError));
  });

  it("treats a valid but non-array note index as empty", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    localStorage.setItem(noteIndexKey, JSON.stringify({ noteIds: ["note-1"] }));

    await expect(getNotes()).resolves.toEqual([]);
    expect(warning).not.toHaveBeenCalled();
  });

  it("removes an individual note and its index entry", async () => {
    const firstNote = createNote("note-1", "First");
    const secondNote = createNote("note-2", "Second");
    setNote(firstNote);
    setNote(secondNote);

    deleteNote(firstNote.id);

    expect(localStorage.getItem(`${noteKeyPrefix}.${firstNote.id}`)).toBeNull();
    await expect(getNotes()).resolves.toEqual([secondNote]);
  });

  it("removes indexed and orphaned note records without touching unrelated local storage", async () => {
    setNote(createNote("indexed-note", "Indexed"));
    localStorage.setItem(`${noteKeyPrefix}.orphaned-note`, JSON.stringify(createNote("orphaned-note", "Orphaned")));
    localStorage.setItem("solisware.axion-notes.settings", "unrelated settings");

    deleteAllNotes();

    expect(localStorage.getItem(noteIndexKey)).toBeNull();
    expect(localStorage.getItem(`${noteKeyPrefix}.indexed-note`)).toBeNull();
    expect(localStorage.getItem(`${noteKeyPrefix}.orphaned-note`)).toBeNull();
    expect(localStorage.getItem("solisware.axion-notes.settings")).toBe("unrelated settings");
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
