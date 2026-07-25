/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export const menuIds = {
  app: {
    lockNotes: "lockNotes",
    settings: "settings"
  },
  file: {
    root: "fileMenu",
    lockNotes: "lockNotes",
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
    inlineCode: "formatInlineCode",
    highlight: "formatHighlight",
    superscript: "formatSuperscript",
    subscript: "formatSubscript",
    bulletList: "formatBulletList",
    dashedList: "formatDashedList",
    numberedList: "formatNumberedList",
    checklist: "formatChecklist",
    fontSize: {
      root: "formatFontSize",
      option: (fontSize: number) => `formatFontSize-${fontSize}`
    },
    fontFamily: {
      root: "formatFontFamily",
      option: (noteFont: string) => `formatFontFamily-${noteFont}`
    },
    clearFormatting: "formatClearFormatting"
  },
  view: {
    root: "viewMenu",
    toggleFullScreen: "toggleFullScreen"
  },
  help: {
    root: "helpMenu",
    welcome: "welcome",
    viewLicense: "viewLicense",
    visitWebsite: "visitWebsite",
    checkoutGitHub: "checkoutGitHub"
  }
} as const;
