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
    selectNote: "selectNote",
    selectAllNotes: "selectAllNotes",
    cancelNoteSelection: "cancelNoteSelection",
    deleteAllNotes: "deleteAllNotes"
  },
  format: {
    root: "formatMenu",
    bold: "formatBold",
    italic: "formatItalic",
    underline: "formatUnderline",
    strikethrough: "formatStrikethrough",
    superscript: "formatSuperscript",
    subscript: "formatSubscript",
    bulletList: "formatBulletList",
    dashedList: "formatDashedList",
    numberedList: "formatNumberedList",
    fontSize: {
      root: "formatFontSize",
      option: (fontSize: number) => `formatFontSize-${fontSize}`
    },
    fontFamily: {
      root: "formatFontFamily",
      option: (noteFont: string) => `formatFontFamily-${noteFont}`
    }
  }
} as const;
