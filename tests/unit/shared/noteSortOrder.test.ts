/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";
import { getNotesResortedMessage, NoteSortOrder } from "../../../src/settings/noteSortOrder";

const sortOrderLabels: Record<NoteSortOrder, string> = {
  [NoteSortOrder.CUSTOM]: "Custom order",
  [NoteSortOrder.DATE_CREATED_ASC]: "Date created (oldest first)",
  [NoteSortOrder.DATE_CREATED_DESC]: "Date created (newest first)",
  [NoteSortOrder.LAST_MODIFIED]: "Last modified",
  [NoteSortOrder.TITLE_ASC]: "Title A-Z",
  [NoteSortOrder.TITLE_DESC]: "Title Z-A"
};

const sortOrderLabelKeys: Record<NoteSortOrder, string> = {
  [NoteSortOrder.CUSTOM]: "noteSortCustom",
  [NoteSortOrder.DATE_CREATED_ASC]: "noteSortDateCreatedAsc",
  [NoteSortOrder.DATE_CREATED_DESC]: "noteSortDateCreatedDesc",
  [NoteSortOrder.LAST_MODIFIED]: "lastModified",
  [NoteSortOrder.TITLE_ASC]: "titleAsc",
  [NoteSortOrder.TITLE_DESC]: "titleDesc"
};

describe("getNotesResortedMessage", () => {
  it.each(Object.values(NoteSortOrder))("formats the active %s sort order", (sortOrder) => {
    const translate = vi.fn((key: string, values?: Record<string, string>) => {
      if (key === "notesResortedBy") {
        return `Notes re-sorted by ${values?.sortOrder}`;
      }

      const matchingSortOrder = Object.entries(sortOrderLabelKeys)
        .find(([, labelKey]) => labelKey === key)?.[0] as NoteSortOrder | undefined;

      return matchingSortOrder ? sortOrderLabels[matchingSortOrder] : key;
    });

    expect(getNotesResortedMessage(translate, sortOrder as NoteSortOrder))
      .toBe(`Notes re-sorted by ${sortOrderLabels[sortOrder as NoteSortOrder]}`);
    expect(translate).toHaveBeenCalledWith(sortOrderLabelKeys[sortOrder as NoteSortOrder]);
  });
});
