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
    format: "format",
    formatBold: "formatBold",
    formatItalic: "formatItalic",
    formatUnderline: "formatUnderline",
    formatStrikethrough: "formatStrikethrough",
    deleteAllNotes: "deleteAllNotes"
  }
} as const;
