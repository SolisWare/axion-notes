/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";
import { NoteSortOrder } from "../../../src/settings/noteSortOrder";
import { NoteColorKey } from "../../../src/theme/NoteColors";
import { NoteType } from "../../../src/types/NoteType";
import { getNotesWithPinnedNote, getNotesWithUnpinnedNote } from "../../../src/utils/notePinning";

describe("notePinning", () => {
  it("pins a note after existing pinned notes and records its original ordering", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-18T12:00:00.000Z"));
    const first = note("first", 1);
    const alreadyPinned = note("pinned", 2, { isPinned: true });
    const last = note("last", 3);

    const result = getNotesWithPinnedNote([first, alreadyPinned, last], last);

    expect(result.map(({ id }) => id)).toEqual(["first", "pinned", "last"]);
    expect(result[2]).toMatchObject({
      isPinned: true,
      pinnedFromNoteIds: ["first", "pinned", "last"],
      pinnedOn: new Date("2026-11-18T12:00:00.000Z")
    });
    vi.useRealTimers();
  });

  it("restores a custom-order note after its previous surviving original neighbor", () => {
    const first = note("first", 1);
    const pinned = note("pinned", 2, { isPinned: true, pinnedFromNoteIds: ["first", "pinned", "last"] });
    const last = note("last", 3);

    expect(getNotesWithUnpinnedNote([pinned, first, last], pinned, NoteSortOrder.CUSTOM).map(({ id }) => id))
      .toEqual(["first", "pinned", "last"]);
  });

  it("restores a custom-order note before its next surviving original neighbor", () => {
    const pinned = note("pinned", 2, { isPinned: true, pinnedFromNoteIds: ["missing", "pinned", "last"] });
    const last = note("last", 3);

    expect(getNotesWithUnpinnedNote([pinned, last], pinned, NoteSortOrder.CUSTOM).map(({ id }) => id))
      .toEqual(["pinned", "last"]);
  });

  it("uses neighboring notes or the start when a custom snapshot is unavailable", () => {
    const first = note("first", 1);
    const pinned = note("pinned", 2, { isPinned: true });
    const last = note("last", 3);

    expect(getNotesWithUnpinnedNote([first, pinned, last], pinned, NoteSortOrder.CUSTOM).map(({ id }) => id))
      .toEqual(["first", "pinned", "last"]);
    expect(getNotesWithUnpinnedNote([pinned], pinned, NoteSortOrder.CUSTOM).map(({ id }) => id)).toEqual(["pinned"]);
  });

  it("uses the following unpinned note when a custom-order pin has no previous neighbor", () => {
    const pinned = note("pinned", 2, { isPinned: true });
    const last = note("last", 3);

    expect(getNotesWithUnpinnedNote([pinned, last], pinned, NoteSortOrder.CUSTOM).map(({ id }) => id))
      .toEqual(["pinned", "last"]);
  });

  it("falls back to current neighbors when the stored custom order does not contain the pinned note", () => {
    const first = note("first", 1);
    const pinned = note("pinned", 2, { isPinned: true, pinnedFromNoteIds: ["first", "last"] });
    const last = note("last", 3);

    expect(getNotesWithUnpinnedNote([first, pinned, last], pinned, NoteSortOrder.CUSTOM).map(({ id }) => id))
      .toEqual(["first", "pinned", "last"]);
  });

  it("falls back after exhausted custom-order neighbors", () => {
    const pinned = note("pinned", 2, { isPinned: true, pinnedFromNoteIds: ["missing", "pinned"] });
    const last = note("last", 3);

    expect(getNotesWithUnpinnedNote([pinned, last], pinned, NoteSortOrder.CUSTOM).map(({ id }) => id))
      .toEqual(["pinned", "last"]);
  });

  it("inserts unpinned notes according to a selected standard sort order", () => {
    const first = note("first", 1, { title: "Alpha" });
    const pinned = note("pinned", 2, { isPinned: true, title: "Beta" });
    const last = note("last", 3, { title: "Gamma" });

    expect(getNotesWithUnpinnedNote([pinned, first, last], pinned, NoteSortOrder.TITLE_ASC).map(({ id }) => id))
      .toEqual(["first", "pinned", "last"]);
    expect(getNotesWithUnpinnedNote([first], pinned, NoteSortOrder.DATE_CREATED_ASC).map(({ id }) => id))
      .toEqual(["first", "pinned"]);
  });

  it("inserts a standard-sort note before the next note or at the end", () => {
    const first = note("first", 1, { title: "Beta" });
    const earlyPinned = note("early", 0, { isPinned: true, title: "Alpha" });
    const latePinned = note("late", 5, { isPinned: true, title: "Zulu" });

    expect(getNotesWithUnpinnedNote([earlyPinned, first], earlyPinned, NoteSortOrder.TITLE_ASC).map(({ id }) => id))
      .toEqual(["early", "first"]);
    expect(getNotesWithUnpinnedNote([first], latePinned, NoteSortOrder.DATE_CREATED_ASC).map(({ id }) => id))
      .toEqual(["first", "late"]);
  });
});

function note(id: string, seconds: number, overrides: Partial<NoteType> = {}): NoteType {
  const timestamp = new Date(Date.UTC(2026, 10, 18, 12, 0, seconds));

  return {
    id,
    bgcolor: NoteColorKey.YELLOW,
    content: id,
    createdOn: timestamp,
    lastModifiedOn: timestamp,
    ...overrides
  };
}
