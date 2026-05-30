/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export const channels = {
  menu: {
    newNote: "menu.newNote",
    showWelcome: "menu.showWelcome",
    deleteAllNotes: "menu.deleteAllNotes",
    setNewNoteEnabled: "menu.setNewNoteEnabled",
    setDeleteAllNotesEnabled: "menu.setDeleteAllNotesEnabled"
  },
  settings: {
    getSettings: "settings.getSettings",
    getSettingsFolderLocation: "settings.getSettingsFolderLocation",
    setSettings: "settings.setSettings",
    onSettingsChange: "settings.onSettingsChange"
  },
  storage: {
    setNote: "storage.setNote",
    getNotes: "storage.getNotes",
    getNotesFolderLocation: "storage.getNotesFolderLocation",
    deleteNote: "storage.deleteNote",
    deleteAllNotes: "storage.deleteAllNotes"
  },
  systemTheme: {
    onThemeChange: "systemTheme.onThemeChange"
  }
} as const;
