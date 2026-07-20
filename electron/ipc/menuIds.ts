/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export const menuIds = {
  app: {
    settings: "settings"
  },
  file: {
    newNote: "newNote",
    settings: "settings"
  },
  edit: {
    root: "editMenu",
    cut: "cut",
    copy: "copy",
    paste: "paste",
    delete: "delete",
    deleteAllNotes: "deleteAllNotes"
  },
  format: {
    root: "formatMenu",
    bold: "formatBold",
    italic: "formatItalic",
    underline: "formatUnderline",
    strikethrough: "formatStrikethrough",
    bulletList: "formatBulletList",
    numberedList: "formatNumberedList"
  }
} as const;
