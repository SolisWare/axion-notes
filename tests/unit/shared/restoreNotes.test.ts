/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";
import { prepareRestoredNotes } from "../../../src/backup/restoreNotes";
import { ValidatedBackupArchive } from "../../../src/backup/restoreArchive";
import { NoteType } from "../../../src/types/NoteType";
import { RestoreNotesMode } from "../../../src/types/RestoreNotesMode";

describe("restoreNotes", () => {
  it("replaces current notes in the backup's stored order", () => {
    const archive = createArchive([createNote("backup-2", "Second"), createNote("backup-1", "First")], ["backup-1", "backup-2"]);

    const result = prepareRestoredNotes(archive, [createNote("current", "Current")], RestoreNotesMode.REPLACE_CURRENT, vi.fn());

    expect(result).toEqual({
      notes: [createNote("backup-1", "First"), createNote("backup-2", "Second")],
      restoredNotesCount: 2,
      skippedIdenticalNotesCount: 0
    });
  });

  it("adds new backup notes after current notes and skips exact duplicates", () => {
    const current = [createNote("current", "Current"), createNote("same", "Same")];
    const archive = createArchive([createNote("same", "Same"), createNote("backup", "Backup")], ["same", "backup"]);

    const result = prepareRestoredNotes(archive, current, RestoreNotesMode.ADD_TO_CURRENT, vi.fn());

    expect(result.notes.map((note) => note.id)).toEqual(["current", "same", "backup"]);
    expect(result.restoredNotesCount).toBe(1);
    expect(result.skippedIdenticalNotesCount).toBe(1);
  });

  it("clones conflicting backup notes with unique IDs and remaps pinned note references", () => {
    const current = [createNote("same-id", "Current version")];
    const archivedConflict = {
      ...createNote("same-id", "Backup version"),
      pinnedFromNoteIds: ["referenced-note"]
    };
    const referencedNote = createNote("referenced-note", "Referenced backup note");
    const archive = createArchive([archivedConflict, referencedNote], ["same-id", "referenced-note"]);
    const createNoteId = vi.fn()
      .mockReturnValueOnce("same-id")
      .mockReturnValueOnce("restored-conflict");

    const result = prepareRestoredNotes(archive, current, RestoreNotesMode.ADD_TO_CURRENT, createNoteId);

    expect(result.notes.map((note) => note.id)).toEqual(["same-id", "restored-conflict", "referenced-note"]);
    expect(result.notes[1].pinnedFromNoteIds).toEqual(["referenced-note"]);
    expect(createNoteId).toHaveBeenCalledTimes(2);
  });

  it("remaps references to every cloned conflicting backup note", () => {
    const archive = createArchive([
      { ...createNote("one", "Backup one"), pinnedFromNoteIds: ["two"] },
      createNote("two", "Backup two")
    ], ["one", "two"]);
    const current = [createNote("one", "Current one"), createNote("two", "Current two")];
    const createNoteId = vi.fn()
      .mockReturnValueOnce("restored-one")
      .mockReturnValueOnce("restored-two");

    const result = prepareRestoredNotes(archive, current, RestoreNotesMode.ADD_TO_CURRENT, createNoteId);

    expect(result.notes[2].pinnedFromNoteIds).toEqual(["restored-two"]);
  });
});

function createArchive(notes: NoteType[], noteOrder: string[]): ValidatedBackupArchive {
  return {
    contentSelection: { appSettings: false, mainWindowState: false },
    createdAt: "2026-11-07T12:00:00.000Z",
    noteOrder,
    notes
  };
}

function createNote(id: string, content: string): NoteType {
  return {
    bgcolor: "yellow",
    content,
    createdOn: new Date("2026-11-07T10:00:00.000Z"),
    id,
    lastModifiedOn: new Date("2026-11-07T11:00:00.000Z")
  };
}
