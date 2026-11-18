/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { NoteSortOrder } from "../../../src/settings/noteSortOrder";
import { NoteColorKey } from "../../../src/theme/NoteColors";
import { NoteType } from "../../../src/types/NoteType";
import { isPinnedNote, sortNotes } from "../../../src/utils/noteSorting";

describe("noteSorting", () => {
  it("keeps pinned notes first while preserving custom order", () => {
    const notes = [note("later", 3), note("pinned", 2, { isPinned: true }), note("earlier", 1)];

    expect(sortNotes(notes, NoteSortOrder.CUSTOM).map(({ id }) => id)).toEqual(["pinned", "later", "earlier"]);
  });

  it.each([
    [NoteSortOrder.DATE_CREATED_ASC, ["pinned", "earlier", "later"]],
    [NoteSortOrder.DATE_CREATED_DESC, ["pinned", "later", "earlier"]],
    [NoteSortOrder.LAST_MODIFIED, ["pinned", "earlier", "later"]],
    [NoteSortOrder.TITLE_ASC, ["pinned", "earlier", "later"]],
    [NoteSortOrder.TITLE_DESC, ["pinned", "later", "earlier"]]
  ])("sorts unpinned notes by %s", (sortOrder, expectedOrder) => {
    const notes = [
      note("later", 3, { content: "  beta  ", lastModifiedOn: date(1) }),
      note("pinned", 2, { isPinned: true, title: "Pinned", lastModifiedOn: date(5) }),
      note("earlier", 1, { content: "Alpha", lastModifiedOn: date(2) })
    ];

    expect(sortNotes(notes, sortOrder as NoteSortOrder).map(({ id }) => id)).toEqual(expectedOrder);
  });

  it("sorts titles case-insensitively and preserves equal-item order", () => {
    const notes = [note("first", 1, { title: "alpha" }), note("second", 2, { title: "Alpha" })];

    expect(sortNotes(notes, NoteSortOrder.TITLE_ASC).map(({ id }) => id)).toEqual(["first", "second"]);
    expect(isPinnedNote(note("pinned", 1, { isPinned: true }))).toBe(true);
    expect(isPinnedNote(note("not-pinned", 1))).toBe(false);
  });
});

function note(id: string, createdAt: number, overrides: Partial<NoteType> = {}): NoteType {
  return {
    id,
    bgcolor: NoteColorKey.YELLOW,
    content: id,
    createdOn: date(createdAt),
    lastModifiedOn: date(createdAt),
    ...overrides
  };
}

function date(seconds: number): Date {
  return new Date(Date.UTC(2026, 10, 18, 12, 0, seconds));
}
