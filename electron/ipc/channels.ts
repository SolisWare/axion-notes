/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export const channels = {
  appWindow: {
    close: "appWindow.close",
    setAlwaysOnTop: "appWindow.setAlwaysOnTop",
    setLayout: "appWindow.setLayout"
  },
  menu: {
    newNote: "menu.newNote",
    showWelcome: "menu.showWelcome",
    deleteAllNotes: "menu.deleteAllNotes",
    setNewNoteEnabled: "menu.setNewNoteEnabled",
    setDeleteAllNotesEnabled: "menu.setDeleteAllNotesEnabled",
    setEditSelectionState: "menu.setEditSelectionState"
  },
  noteSort: {
    requestSort: "noteSort.requestSort",
    onSortRequest: "noteSort.onSortRequest"
  },
  noteWindow: {
    open: "noteWindow.open"
  },
  settings: {
    getSettings: "settings.getSettings",
    getSettingsFolderLocation: "settings.getSettingsFolderLocation",
    setSettings: "settings.setSettings",
    onSettingsChange: "settings.onSettingsChange"
  },
  storage: {
    setNote: "storage.setNote",
    setNoteOrder: "storage.setNoteOrder",
    getNotes: "storage.getNotes",
    getNotesFolderLocation: "storage.getNotesFolderLocation",
    deleteNote: "storage.deleteNote",
    deleteAllNotes: "storage.deleteAllNotes",
    onNotesChange: "storage.onNotesChange"
  },
  systemTheme: {
    onThemeChange: "systemTheme.onThemeChange"
  }
} as const;
