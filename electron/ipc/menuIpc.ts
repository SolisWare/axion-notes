/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { clipboard, ipcMain, Menu } from "electron";
import { MenuEditSelectionState } from "../../src/models/MenuEditSelectionState";
import { channels } from "./channels";
import { menuIds } from "./menuIds";

let isNewNoteEnabled = true;
let isDeleteAllNotesEnabled = false;
let editSelectionState: MenuEditSelectionState = {
  hasSelection: false,
  hasEditableSelection: false
};

function updateNoteMenuItems(): void {
  const applicationMenu = Menu.getApplicationMenu();
  const newNoteMenuItem = applicationMenu?.getMenuItemById(menuIds.file.newNote);
  const editMenu = applicationMenu?.getMenuItemById(menuIds.edit.root);
  const cutMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.cut);
  const copyMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.copy);
  const pasteMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.paste);
  const deleteMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.delete);
  const deleteAllNotesMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.deleteAllNotes);
  const hasClipboardContent = clipboard.availableFormats().length > 0;

  if (newNoteMenuItem) {
    newNoteMenuItem.enabled = isNewNoteEnabled;
  }

  if (editMenu) {
    editMenu.submenu?.items.forEach((item) => {
      item.enabled = isNewNoteEnabled;
    });
  }

  if (cutMenuItem) {
    cutMenuItem.enabled = isNewNoteEnabled && editSelectionState.hasEditableSelection;
  }

  if (copyMenuItem) {
    copyMenuItem.enabled = isNewNoteEnabled && editSelectionState.hasSelection;
  }

  if (pasteMenuItem) {
    pasteMenuItem.enabled = isNewNoteEnabled && hasClipboardContent;
  }

  if (deleteMenuItem) {
    deleteMenuItem.enabled = isNewNoteEnabled && editSelectionState.hasEditableSelection;
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

  ipcMain.on(channels.menu.setEditSelectionState, (_, state: MenuEditSelectionState) => {
    editSelectionState = state;
    updateNoteMenuItems();
  });
}
