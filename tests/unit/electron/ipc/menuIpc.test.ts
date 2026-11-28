/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { menuIds } from "../../../../electron/ipc/menuIds";
import { NOTE_FONT_OPTIONS } from "../../../../src/settings/NoteFontPreference";
import { NOTE_CONTENT_FONT_SIZE_OPTIONS } from "../../../../src/settings/NoteFontSize";
import { NoteLayoutPreference } from "../../../../src/settings/NoteLayoutPreference";
import { NoteSortOrder } from "../../../../src/settings/noteSortOrder";

type TestMenuItem = {
  checked?: boolean;
  enabled?: boolean;
  id?: string;
  label?: string;
  role?: string;
  submenu?: { items: TestMenuItem[] };
  type?: string;
};

const mocks = vi.hoisted(() => ({
  availableFormats: vi.fn(),
  fromWebContents: vi.fn(),
  getApplicationMenu: vi.fn(),
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  translate: vi.fn((key: string) => key)
}));

vi.mock("electron", () => ({
  BrowserWindow: { fromWebContents: mocks.fromWebContents },
  clipboard: { availableFormats: mocks.availableFormats },
  ipcMain: { on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => mocks.handlers.set(channel, handler)) },
  Menu: { getApplicationMenu: mocks.getApplicationMenu }
}));

vi.mock("../../../../electron/utils/electronI18n", () => ({ translate: mocks.translate }));

describe("native menu IPC", () => {
  beforeEach(() => {
    mocks.availableFormats.mockReset();
    mocks.availableFormats.mockReturnValue([]);
    mocks.fromWebContents.mockReset();
    mocks.getApplicationMenu.mockReset();
    mocks.handlers.clear();
    mocks.translate.mockClear();
  });

  it("reflects current settings, selections, clipboard state, and rich-text formatting in the native menu", async () => {
    const menu = createMenu();
    mocks.getApplicationMenu.mockReturnValue(menu);
    mocks.availableFormats.mockReturnValue(["text/plain"]);
    mocks.fromWebContents.mockReturnValue({ isFocused: vi.fn(() => true) });
    const { applyMenuSettings, registerMenuIpc } = await loadMenuIpc();
    registerMenuIpc();

    applyMenuSettings({
      lockScreenEnabled: true,
      noteLayout: NoteLayoutPreference.LIST,
      notesEncryptionEnabled: true,
      notesSortOrder: NoteSortOrder.TITLE_DESC
    } as never);
    emit(channels.menu.setNewNoteEnabled, true);
    emit(channels.menu.setDeleteAllNotesEnabled, true);
    emit(channels.menu.setEditSelectionState, {
      hasEditableSelection: true,
      hasSelection: true
    });
    emit(channels.menu.setNoteSelectionState, {
      areAllNotesSelected: true,
      hasNotes: true,
      isSelectionMode: true
    });
    emit(channels.menu.setRichTextFormatState, createActiveFormatState());

    expect(getItem(menu, menuIds.file.newNote).enabled).toBe(true);
    expect(getItem(menu, menuIds.edit.cut).enabled).toBe(true);
    expect(getItem(menu, menuIds.edit.copy).enabled).toBe(true);
    expect(getItem(menu, menuIds.edit.paste).enabled).toBe(true);
    expect(getItem(menu, menuIds.edit.deleteAllNotes).enabled).toBe(true);
    expect(getItem(menu, menuIds.edit.selectAllNotes).label).toBe("deselectAllNotes");
    expect(getItem(menu, menuIds.edit.cancelNoteSelection).enabled).toBe(true);
    expect(getItem(menu, menuIds.format.bold).checked).toBe(true);
    expect(getItem(menu, menuIds.format.dashedList).checked).toBe(true);
    expect(getItem(menu, menuIds.format.fontSize.option(20)).checked).toBe(true);
    expect(getItem(menu, menuIds.format.fontFamily.option("serif")).checked).toBe(true);
    expect(getItem(menu, menuIds.edit.sortNotes.option(NoteSortOrder.TITLE_DESC)).checked).toBe(true);
    expect(getItem(menu, menuIds.edit.sortNotes.resort).enabled).toBe(true);
    expect(getItem(menu, menuIds.view.listView).checked).toBe(true);
  });

  it("does not update editable selection state from an unfocused renderer", async () => {
    const menu = createMenu();
    mocks.getApplicationMenu.mockReturnValue(menu);
    mocks.fromWebContents.mockReturnValue({ isFocused: vi.fn(() => false) });
    const { registerMenuIpc } = await loadMenuIpc();
    registerMenuIpc();
    emit(channels.menu.setNewNoteEnabled, true);

    emit(channels.menu.setEditSelectionState, { hasEditableSelection: true, hasSelection: true });

    expect(getItem(menu, menuIds.edit.cut).enabled).toBe(false);
    expect(getItem(menu, menuIds.edit.copy).enabled).toBe(false);
  });

  it("restricts the locked menu to allowed actions and restores it after unlock", async () => {
    const menu = createMenu();
    const about = { role: "about" };
    const blocked = { id: menuIds.file.newNote };
    const secureLock = { id: menuIds.file.secureLock };
    menu.items = [{ submenu: { items: [about, blocked, secureLock] } }];
    mocks.getApplicationMenu.mockReturnValue(menu);
    const { applyMenuSettings, setLockScreenActive, setSecureLockAvailable, setStorageMigrationActive } = await loadMenuIpc();

    applyMenuSettings({
      lockScreenEnabled: true,
      noteLayout: NoteLayoutPreference.GRID,
      notesEncryptionEnabled: true,
      notesSortOrder: NoteSortOrder.DATE_CREATED_ASC
    } as never);
    setSecureLockAvailable(true);
    setLockScreenActive(true);

    expect(about.enabled).toBe(true);
    expect(secureLock.enabled).toBe(true);
    expect(blocked.enabled).toBe(false);
    setStorageMigrationActive(true);
    expect(secureLock.enabled).toBe(false);
    setLockScreenActive(false);

    expect(blocked.enabled).toBe(true);
  });
});

async function loadMenuIpc() {
  vi.resetModules();
  return import("../../../../electron/ipc/menuIpc");
}

function createMenu(): { items: TestMenuItem[]; getMenuItemById: (id: string) => TestMenuItem } {
  const items = new Map<string, TestMenuItem>();
  const ids = [
    menuIds.app.lockNotes, menuIds.app.secureLock, menuIds.file.lockNotes, menuIds.file.secureLock, menuIds.file.newNote,
    menuIds.edit.root, menuIds.edit.cut, menuIds.edit.copy, menuIds.edit.paste, menuIds.edit.delete, menuIds.edit.selectNote,
    menuIds.edit.selectAllNotes, menuIds.edit.cancelNoteSelection, menuIds.edit.deleteAllNotes, menuIds.edit.sortNotes.root,
    menuIds.edit.sortNotes.resort, menuIds.view.gridView, menuIds.view.listView, menuIds.format.root, menuIds.format.bold,
    menuIds.format.italic, menuIds.format.underline, menuIds.format.strikethrough, menuIds.format.inlineCode, menuIds.format.highlight,
    menuIds.format.superscript, menuIds.format.subscript, menuIds.format.bulletList, menuIds.format.dashedList,
    menuIds.format.numberedList, menuIds.format.checklist, menuIds.format.fontSize.root, menuIds.format.fontFamily.root,
    menuIds.format.clearFormatting
  ];
  for (const id of ids) {
    items.set(id, { id, enabled: false });
  }

  for (const size of NOTE_CONTENT_FONT_SIZE_OPTIONS) {
    items.set(menuIds.format.fontSize.option(size), { enabled: false });
  }

  for (const font of NOTE_FONT_OPTIONS) {
    items.set(menuIds.format.fontFamily.option(font.value), { enabled: false });
  }

  for (const sortOrder of Object.values(NoteSortOrder)) {
    items.set(menuIds.edit.sortNotes.option(sortOrder), { enabled: false });
  }

  const editMenu = getItemFromMap(items, menuIds.edit.root);
  editMenu.submenu = { items: [{ enabled: false }, { enabled: false }] };
  return {
    items: [{ enabled: false }],
    getMenuItemById: (id) => getItemFromMap(items, id)
  };
}

function createActiveFormatState() {
  return {
    activeFont: "serif",
    activeFontSize: 20,
    canFormat: true,
    isBoldActive: true,
    isBulletListActive: false,
    isChecklistActive: false,
    isDashedListActive: true,
    isFontMixed: false,
    isFontSizeMixed: false,
    isHighlightActive: false,
    isInlineCodeActive: false,
    isItalicActive: false,
    isNumberedListActive: false,
    isStrikethroughActive: false,
    isSubscriptActive: false,
    isSuperscriptActive: false,
    isUnderlineActive: false
  };
}

function emit(channel: string, ...args: unknown[]): void {
  const handler = mocks.handlers.get(channel);

  if (!handler) {
    throw new Error(`No menu listener registered for ${channel}.`);
  }

  handler({ sender: {} }, ...args);
}

function getItem(menu: { getMenuItemById: (id: string) => TestMenuItem }, id: string): TestMenuItem {
  return menu.getMenuItemById(id);
}

function getItemFromMap(items: Map<string, TestMenuItem>, id: string): TestMenuItem {
  const item = items.get(id);

  if (!item) {
    throw new Error(`No test menu item exists for ${id}.`);
  }

  return item;
}
