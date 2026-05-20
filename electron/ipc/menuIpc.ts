/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ipcMain, Menu } from "electron";
import { channels } from "./channels";

let isNewNoteEnabled = true;
let isDeleteAllNotesEnabled = false;

function updateNoteMenuItems(): void {
  const applicationMenu = Menu.getApplicationMenu();
  const newNoteMenuItem = applicationMenu?.getMenuItemById("newNote");
  const editMenu = applicationMenu?.getMenuItemById("editMenu");
  const deleteAllNotesMenuItem = applicationMenu?.getMenuItemById("deleteAllNotes");

  if (newNoteMenuItem) {
    newNoteMenuItem.enabled = isNewNoteEnabled;
  }

  if (editMenu) {
    editMenu.submenu?.items.forEach((item) => {
      item.enabled = isNewNoteEnabled;
    });
  }

  if (deleteAllNotesMenuItem) {
    deleteAllNotesMenuItem.enabled = isNewNoteEnabled && isDeleteAllNotesEnabled;
  }
}

export function registerMenuIpc(): void {
  ipcMain.on(channels.menu.setNewNoteEnabled, (_, enabled: boolean) => {
    isNewNoteEnabled = enabled;
    updateNoteMenuItems();
  });

  ipcMain.on(channels.menu.setDeleteAllNotesEnabled, (_, enabled: boolean) => {
    isDeleteAllNotesEnabled = enabled;
    updateNoteMenuItems();
  });
}
