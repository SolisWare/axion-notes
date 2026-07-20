/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { clipboard, ipcMain, Menu } from "electron";
import { MenuEditSelectionState } from "../../src/models/MenuEditSelectionState";
import { RichTextFormatState } from "../../src/models/RichTextFormatState";
import { channels } from "./channels";
import { menuIds } from "./menuIds";

let isNewNoteEnabled = true;
let isDeleteAllNotesEnabled = false;
let editSelectionState: MenuEditSelectionState = {
  hasSelection: false,
  hasEditableSelection: false
};
let richTextFormatState: RichTextFormatState = {
  canFormat: false,
  isBoldActive: false,
  isItalicActive: false,
  isUnderlineActive: false,
  isStrikethroughActive: false,
  isBulletListActive: false,
  isNumberedListActive: false
};

function updateNoteMenuItems(): void {
  const applicationMenu = Menu.getApplicationMenu();
  const newNoteMenuItem = applicationMenu?.getMenuItemById(menuIds.file.newNote);
  const editMenu = applicationMenu?.getMenuItemById(menuIds.edit.root);
  const cutMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.cut);
  const copyMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.copy);
  const pasteMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.paste);
  const deleteMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.delete);
  const formatMenuItem = applicationMenu?.getMenuItemById(menuIds.format.root);
  const formatBoldMenuItem = applicationMenu?.getMenuItemById(menuIds.format.bold);
  const formatItalicMenuItem = applicationMenu?.getMenuItemById(menuIds.format.italic);
  const formatUnderlineMenuItem = applicationMenu?.getMenuItemById(menuIds.format.underline);
  const formatStrikethroughMenuItem = applicationMenu?.getMenuItemById(menuIds.format.strikethrough);
  const formatBulletListMenuItem = applicationMenu?.getMenuItemById(menuIds.format.bulletList);
  const formatNumberedListMenuItem = applicationMenu?.getMenuItemById(menuIds.format.numberedList);
  const deleteAllNotesMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.deleteAllNotes);
  const hasClipboardContent = clipboard.availableFormats().length > 0;
  const isRichTextFormattingEnabled = isNewNoteEnabled && richTextFormatState.canFormat;

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

  if (formatMenuItem) {
    formatMenuItem.enabled = isRichTextFormattingEnabled;
  }

  if (formatBoldMenuItem) {
    formatBoldMenuItem.enabled = isRichTextFormattingEnabled;
    formatBoldMenuItem.checked = richTextFormatState.isBoldActive;
  }

  if (formatItalicMenuItem) {
    formatItalicMenuItem.enabled = isRichTextFormattingEnabled;
    formatItalicMenuItem.checked = richTextFormatState.isItalicActive;
  }

  if (formatUnderlineMenuItem) {
    formatUnderlineMenuItem.enabled = isRichTextFormattingEnabled;
    formatUnderlineMenuItem.checked = richTextFormatState.isUnderlineActive;
  }

  if (formatStrikethroughMenuItem) {
    formatStrikethroughMenuItem.enabled = isRichTextFormattingEnabled;
    formatStrikethroughMenuItem.checked = richTextFormatState.isStrikethroughActive;
  }

  if (formatBulletListMenuItem) {
    formatBulletListMenuItem.enabled = isRichTextFormattingEnabled;
    formatBulletListMenuItem.checked = richTextFormatState.isBulletListActive;
  }

  if (formatNumberedListMenuItem) {
    formatNumberedListMenuItem.enabled = isRichTextFormattingEnabled;
    formatNumberedListMenuItem.checked = richTextFormatState.isNumberedListActive;
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

  ipcMain.on(channels.menu.setRichTextFormatState, (_, state: RichTextFormatState) => {
    richTextFormatState = state;
    updateNoteMenuItems();
  });
}
