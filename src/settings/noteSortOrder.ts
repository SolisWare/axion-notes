/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export const NoteSortOrder = {
  CUSTOM: "custom",
  DATE_CREATED_ASC: "dateCreatedAsc",
  DATE_CREATED_DESC: "dateCreatedDesc",
  LAST_MODIFIED: "lastModified",
  TITLE_ASC: "titleAsc",
  TITLE_DESC: "titleDesc"
};

export type NoteSortOrder = typeof NoteSortOrder[keyof typeof NoteSortOrder];

type Translate = (key: string, values?: Record<string, string>) => string;

export function getNotesResortedMessage(translate: Translate, sortOrder: NoteSortOrder): string {
  return translate("notesResortedBy", {
    sortOrder: translate(labelKeys[sortOrder])
  });
}

const labelKeys: Record<NoteSortOrder, string> = {
  [NoteSortOrder.CUSTOM]: "noteSortCustom",
  [NoteSortOrder.DATE_CREATED_ASC]: "noteSortDateCreatedAsc",
  [NoteSortOrder.DATE_CREATED_DESC]: "noteSortDateCreatedDesc",
  [NoteSortOrder.LAST_MODIFIED]: "lastModified",
  [NoteSortOrder.TITLE_ASC]: "titleAsc",
  [NoteSortOrder.TITLE_DESC]: "titleDesc"
};
