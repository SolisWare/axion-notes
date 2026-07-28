/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, clipboard, ipcMain, Menu } from "electron";
import { MenuEditSelectionState } from "../../src/models/MenuEditSelectionState";
import { MenuNoteSelectionState } from "../../src/models/MenuNoteSelectionState";
import { getInactiveRichTextFormatState, RichTextFormatState } from "../../src/models/RichTextFormatState";
import { AppSettings } from "../../src/settings/AppSettings";
import { NOTE_FONT_OPTIONS, NoteFontPreference } from "../../src/settings/NoteFontPreference";
import { DEFAULT_NOTE_CONTENT_FONT_SIZE, NOTE_CONTENT_FONT_SIZE_OPTIONS } from "../../src/settings/NoteFontSize";
import { channels } from "./channels";
import { menuIds } from "./menuIds";
import { translate } from "../utils/electronI18n";

let isNewNoteEnabled = true;
let isDeleteAllNotesEnabled = false;
let isLockScreenEnabled = false;
let isLockScreenActive = false;
let editSelectionState: MenuEditSelectionState = {
  hasSelection: false,
  hasEditableSelection: false
};
let noteSelectionState: MenuNoteSelectionState = {
  hasNotes: false,
  isSelectionMode: false,
  areAllNotesSelected: false
};
let richTextFormatState: RichTextFormatState = getInactiveRichTextFormatState();

export function isRichTextFormattingActive(): boolean {
  return isNewNoteEnabled && richTextFormatState.canFormat;
}

function isLockScreenMenuItemAllowed(item: Electron.MenuItem): boolean {
  return item.role === "about"
    || item.role === "close"
    || item.role === "quit"
    || item.id === menuIds.view.toggleFullScreen
    || item.id === menuIds.help.viewLicense
    || item.id === menuIds.help.visitWebsite
    || item.id === menuIds.help.checkoutGitHub;
}

function updateLockScreenMenuItems(): void {
  const applicationMenu = Menu.getApplicationMenu();

  function updateMenuItem(item: Electron.MenuItem): boolean {
    if (item.type === "separator") {
      return false;
    }

    const hasEnabledSubmenuItem = item.submenu?.items
      .map(updateMenuItem)
      .some((isEnabled) => isEnabled) ?? false;
    const isEnabled = isLockScreenMenuItemAllowed(item) || hasEnabledSubmenuItem;

    item.enabled = isEnabled;
    return isEnabled;
  }

  applicationMenu?.items.forEach(updateMenuItem);
}

function restoreUnlockedMenuItems(applicationMenu: Menu | null): void {
  function enableMenuItem(item: Electron.MenuItem): void {
    if (item.type === "separator") {
      return;
    }

    item.enabled = true;
    item.submenu?.items.forEach(enableMenuItem);
  }

  applicationMenu?.items.forEach(enableMenuItem);
}

function updateNoteMenuItems(): void {
  if (isLockScreenActive) {
    updateLockScreenMenuItems();
    return;
  }

  const applicationMenu = Menu.getApplicationMenu();
  restoreUnlockedMenuItems(applicationMenu);

  const appLockNotesMenuItem = applicationMenu?.getMenuItemById(menuIds.app.lockNotes);
  const fileLockNotesMenuItem = applicationMenu?.getMenuItemById(menuIds.file.lockNotes);
  const newNoteMenuItem = applicationMenu?.getMenuItemById(menuIds.file.newNote);
  const editMenu = applicationMenu?.getMenuItemById(menuIds.edit.root);
  const cutMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.cut);
  const copyMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.copy);
  const pasteMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.paste);
  const deleteMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.delete);
  const selectNoteMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.selectNote);
  const selectAllNotesMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.selectAllNotes);
  const cancelNoteSelectionMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.cancelNoteSelection);
  const formatMenuItem = applicationMenu?.getMenuItemById(menuIds.format.root);
  const formatBoldMenuItem = applicationMenu?.getMenuItemById(menuIds.format.bold);
  const formatItalicMenuItem = applicationMenu?.getMenuItemById(menuIds.format.italic);
  const formatUnderlineMenuItem = applicationMenu?.getMenuItemById(menuIds.format.underline);
  const formatStrikethroughMenuItem = applicationMenu?.getMenuItemById(menuIds.format.strikethrough);
  const formatInlineCodeMenuItem = applicationMenu?.getMenuItemById(menuIds.format.inlineCode);
  const formatHighlightMenuItem = applicationMenu?.getMenuItemById(menuIds.format.highlight);
  const formatSuperscriptMenuItem = applicationMenu?.getMenuItemById(menuIds.format.superscript);
  const formatSubscriptMenuItem = applicationMenu?.getMenuItemById(menuIds.format.subscript);
  const formatBulletListMenuItem = applicationMenu?.getMenuItemById(menuIds.format.bulletList);
  const formatDashedListMenuItem = applicationMenu?.getMenuItemById(menuIds.format.dashedList);
  const formatNumberedListMenuItem = applicationMenu?.getMenuItemById(menuIds.format.numberedList);
  const formatChecklistMenuItem = applicationMenu?.getMenuItemById(menuIds.format.checklist);
  const formatFontSizeMenuItem = applicationMenu?.getMenuItemById(menuIds.format.fontSize.root);
  const formatFontFamilyMenuItem = applicationMenu?.getMenuItemById(menuIds.format.fontFamily.root);
  const formatClearFormattingMenuItem = applicationMenu?.getMenuItemById(menuIds.format.clearFormatting);
  const deleteAllNotesMenuItem = applicationMenu?.getMenuItemById(menuIds.edit.deleteAllNotes);
  const hasClipboardContent = clipboard.availableFormats().length > 0;
  const isRichTextFormattingEnabled = isNewNoteEnabled && richTextFormatState.canFormat;
  const activeFontSize = richTextFormatState.activeFontSize ?? DEFAULT_NOTE_CONTENT_FONT_SIZE;
  const activeFont = richTextFormatState.activeFont ?? NoteFontPreference.SYSTEM;

  if (appLockNotesMenuItem) {
    appLockNotesMenuItem.enabled = isLockScreenEnabled;
  }

  if (fileLockNotesMenuItem) {
    fileLockNotesMenuItem.enabled = isLockScreenEnabled;
  }

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

  if (selectNoteMenuItem) {
    selectNoteMenuItem.enabled = isNewNoteEnabled && noteSelectionState.hasNotes && !noteSelectionState.isSelectionMode;
  }

  if (selectAllNotesMenuItem) {
    selectAllNotesMenuItem.enabled = isNewNoteEnabled && noteSelectionState.hasNotes;
    selectAllNotesMenuItem.label = translate(
      noteSelectionState.areAllNotesSelected
        ? "electron.menu.deselectAllNotes"
        : "electron.menu.selectAllNotes"
    );
  }

  if (cancelNoteSelectionMenuItem) {
    cancelNoteSelectionMenuItem.enabled = isNewNoteEnabled && noteSelectionState.isSelectionMode;
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

  if (formatInlineCodeMenuItem) {
    formatInlineCodeMenuItem.enabled = isRichTextFormattingEnabled;
    formatInlineCodeMenuItem.checked = richTextFormatState.isInlineCodeActive;
  }

  if (formatHighlightMenuItem) {
    formatHighlightMenuItem.enabled = isRichTextFormattingEnabled;
    formatHighlightMenuItem.checked = richTextFormatState.isHighlightActive;
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

  if (formatChecklistMenuItem) {
    formatChecklistMenuItem.enabled = isRichTextFormattingEnabled;
    formatChecklistMenuItem.checked = richTextFormatState.isChecklistActive;
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

  if (formatClearFormattingMenuItem) {
    formatClearFormattingMenuItem.enabled = isRichTextFormattingEnabled;
  }

  if (deleteAllNotesMenuItem) {
    deleteAllNotesMenuItem.enabled = isNewNoteEnabled && isDeleteAllNotesEnabled;
  }
}

export function applyMenuSettings(settings: AppSettings): void {
  isLockScreenEnabled = settings.lockScreenEnabled;
  updateNoteMenuItems();
}

export function setLockScreenActive(active: boolean): void {
  isLockScreenActive = active;
  updateNoteMenuItems();
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

  ipcMain.on(channels.menu.setEditSelectionState, (event, state: MenuEditSelectionState) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);

    if (!senderWindow?.isFocused()) {
      return;
    }

    editSelectionState = state;
    updateNoteMenuItems();
  });

  ipcMain.on(channels.menu.setNoteSelectionState, (_, state: MenuNoteSelectionState) => {
    noteSelectionState = state;
    updateNoteMenuItems();
  });

  ipcMain.on(channels.menu.setRichTextFormatState, (_, state: RichTextFormatState) => {
    richTextFormatState = state;
    updateNoteMenuItems();
  });
}
