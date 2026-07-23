/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { clipboard, ipcMain, Menu } from "electron";
import { MenuEditSelectionState } from "../../src/models/MenuEditSelectionState";
import { getInactiveRichTextFormatState, RichTextFormatState } from "../../src/models/RichTextFormatState";
import { NOTE_FONT_OPTIONS, NoteFontPreference } from "../../src/settings/NoteFontPreference";
import { DEFAULT_NOTE_CONTENT_FONT_SIZE, NOTE_CONTENT_FONT_SIZE_OPTIONS } from "../../src/settings/NoteFontSize";
import { channels } from "./channels";
import { menuIds } from "./menuIds";

let isNewNoteEnabled = true;
let isDeleteAllNotesEnabled = false;
let editSelectionState: MenuEditSelectionState = {
  hasSelection: false,
  hasEditableSelection: false
};
let richTextFormatState: RichTextFormatState = getInactiveRichTextFormatState();

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
  const formatSuperscriptMenuItem = applicationMenu?.getMenuItemById(menuIds.format.superscript);
  const formatSubscriptMenuItem = applicationMenu?.getMenuItemById(menuIds.format.subscript);
  const formatBulletListMenuItem = applicationMenu?.getMenuItemById(menuIds.format.bulletList);
  const formatDashedListMenuItem = applicationMenu?.getMenuItemById(menuIds.format.dashedList);
  const formatNumberedListMenuItem = applicationMenu?.getMenuItemById(menuIds.format.numberedList);
  const formatFontSizeMenuItem = applicationMenu?.getMenuItemById(menuIds.format.fontSize.root);
  const formatFontFamilyMenuItem = applicationMenu?.getMenuItemById(menuIds.format.fontFamily.root);
  const deleteAllNotesMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.deleteAllNotes);
  const hasClipboardContent = clipboard.availableFormats().length > 0;
  const isRichTextFormattingEnabled = isNewNoteEnabled && richTextFormatState.canFormat;
  const activeFontSize = richTextFormatState.activeFontSize ?? DEFAULT_NOTE_CONTENT_FONT_SIZE;
  const activeFont = richTextFormatState.activeFont ?? NoteFontPreference.SYSTEM;

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

  if (formatSuperscriptMenuItem) {
    formatSuperscriptMenuItem.enabled = isRichTextFormattingEnabled;
    formatSuperscriptMenuItem.checked = richTextFormatState.isSuperscriptActive;
  }

  if (formatSubscriptMenuItem) {
    formatSubscriptMenuItem.enabled = isRichTextFormattingEnabled;
    formatSubscriptMenuItem.checked = richTextFormatState.isSubscriptActive;
  }

  if (formatBulletListMenuItem) {
    formatBulletListMenuItem.enabled = isRichTextFormattingEnabled;
    formatBulletListMenuItem.checked = richTextFormatState.isBulletListActive;
  }

  if (formatDashedListMenuItem) {
    formatDashedListMenuItem.enabled = isRichTextFormattingEnabled;
    formatDashedListMenuItem.checked = richTextFormatState.isDashedListActive;
  }

  if (formatNumberedListMenuItem) {
    formatNumberedListMenuItem.enabled = isRichTextFormattingEnabled;
    formatNumberedListMenuItem.checked = richTextFormatState.isNumberedListActive;
  }

  if (formatFontSizeMenuItem) {
    formatFontSizeMenuItem.enabled = isRichTextFormattingEnabled;
  }

  NOTE_CONTENT_FONT_SIZE_OPTIONS.forEach((fontSize) => {
    const formatFontSizeOptionMenuItem = applicationMenu?.getMenuItemById(menuIds.format.fontSize.option(fontSize));

    if (formatFontSizeOptionMenuItem) {
      formatFontSizeOptionMenuItem.enabled = isRichTextFormattingEnabled;
      formatFontSizeOptionMenuItem.checked = activeFontSize === fontSize;
    }
  });

  if (formatFontFamilyMenuItem) {
    formatFontFamilyMenuItem.enabled = isRichTextFormattingEnabled;
  }

  NOTE_FONT_OPTIONS.forEach((fontOption) => {
    const formatFontFamilyOptionMenuItem = applicationMenu?.getMenuItemById(menuIds.format.fontFamily.option(fontOption.value));

    if (formatFontFamilyOptionMenuItem) {
      formatFontFamilyOptionMenuItem.enabled = isRichTextFormattingEnabled;
      formatFontFamilyOptionMenuItem.checked = activeFont === fontOption.value;
    }
  });

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
