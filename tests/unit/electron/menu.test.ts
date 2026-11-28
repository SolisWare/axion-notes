/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../electron/ipc/channels";
import { menuIds } from "../../../electron/ipc/menuIds";
import { createMenubar } from "../../../electron/menu";
import { RichTextFormatCommand } from "../../../src/types/RichTextFormatCommand";
import { NoteLayoutPreference } from "../../../src/settings/NoteLayoutPreference";
import { NoteSortOrder } from "../../../src/settings/noteSortOrder";

type MenuItem = {
  checked?: boolean;
  click?: () => void;
  id?: string;
  label?: string;
  role?: string;
  submenu?: MenuItem[];
  visible?: boolean;
};

const mocks = vi.hoisted(() => ({
  buildFromTemplate: vi.fn((template) => template),
  createLicenseWindow: vi.fn(),
  createSettingsWindow: vi.fn(),
  getFocusedWindow: vi.fn(),
  focusedWindow: {
    isFullScreen: vi.fn(() => false),
    setFullScreen: vi.fn(),
    webContents: { send: vi.fn() }
  },
  getElectronMenuTranslator: vi.fn(() => vi.fn((key: string) => key)),
  isMac: false,
  isWindows: false,
  onLockNotes: vi.fn(),
  onSecureLock: vi.fn(),
  openExternal: vi.fn(),
  translate: vi.fn((key: string) => key)
}));

vi.mock("electron", () => ({
  app: { name: "Axion Notes" },
  BrowserWindow: {
    getFocusedWindow: mocks.getFocusedWindow
  },
  Menu: {
    buildFromTemplate: mocks.buildFromTemplate
  },
  shell: {
    openExternal: mocks.openExternal
  }
}));

vi.mock("../../../electron/utils/Platform", () => ({
  get isMac() {
    return mocks.isMac;
  },
  get isWindows() {
    return mocks.isWindows;
  }
}));

vi.mock("../../../electron/utils/electronI18n", () => ({
  getElectronMenuTranslator: mocks.getElectronMenuTranslator,
  translate: mocks.translate
}));

vi.mock("../../../electron/windows/createLicenseWindow", () => ({
  createLicenseWindow: mocks.createLicenseWindow
}));

vi.mock("../../../electron/windows/createSettingsWindow", () => ({
  createSettingsWindow: mocks.createSettingsWindow
}));

vi.mock("../../../src/utils/text", () => ({
  withEllipsis: (value: string) => `${value}…`
}));

beforeEach(() => {
  mocks.buildFromTemplate.mockClear();
  mocks.createLicenseWindow.mockClear();
  mocks.createSettingsWindow.mockClear();
  mocks.getFocusedWindow.mockReset();
  mocks.getFocusedWindow.mockReturnValue(mocks.focusedWindow);
  mocks.focusedWindow.isFullScreen.mockReset();
  mocks.focusedWindow.isFullScreen.mockReturnValue(false);
  mocks.focusedWindow.setFullScreen.mockClear();
  mocks.focusedWindow.webContents.send.mockClear();
  mocks.getElectronMenuTranslator.mockClear();
  mocks.isMac = false;
  mocks.isWindows = false;
  mocks.onLockNotes.mockClear();
  mocks.onSecureLock.mockClear();
  mocks.openExternal.mockClear();
  mocks.translate.mockClear();
});

describe("application menu", () => {
  it("builds the localized non-macOS template and routes every actionable item", () => {
    mocks.isWindows = true;
    const menu = createMenubar({ onLockNotes: mocks.onLockNotes, onSecureLock: mocks.onSecureLock }) as unknown as MenuItem[];

    expect(mocks.buildFromTemplate).toHaveBeenCalledWith(menu);
    expect(findMenuItem(menu, menuIds.file.root)?.submenu?.some((item) => item.role === "about")).toBe(true);
    expect(findMenuItem(menu, menuIds.edit.delete)).toBeUndefined();
    expect(findMenuItem(menu, menuIds.view.toggleFullScreen)?.label).toBe("toggleFullScreen");
    expect(findMenuItem(menu, menuIds.edit.sortNotes.option(NoteSortOrder.CUSTOM))?.visible).toBe(false);

    invokeEveryMenuAction(menu);

    expect(mocks.onLockNotes).toHaveBeenCalled();
    expect(mocks.onSecureLock).toHaveBeenCalled();
    expect(mocks.createSettingsWindow).toHaveBeenCalledOnce();
    expect(mocks.createLicenseWindow).toHaveBeenCalledOnce();
    expect(mocks.openExternal).toHaveBeenCalledWith("https://solisware.com");
    expect(mocks.openExternal).toHaveBeenCalledWith("https://github.com/SolisWare");
    expect(mocks.focusedWindow.webContents.send).toHaveBeenCalledWith(channels.menu.newNote);
    expect(mocks.focusedWindow.webContents.send).toHaveBeenCalledWith(channels.menu.setNoteLayout, NoteLayoutPreference.GRID);
    expect(mocks.focusedWindow.webContents.send).toHaveBeenCalledWith(channels.menu.setNoteSortOrder, NoteSortOrder.TITLE_DESC);
    expect(mocks.focusedWindow.webContents.send).toHaveBeenCalledWith(channels.menu.formatRichText, RichTextFormatCommand.BOLD);
    expect(mocks.focusedWindow.webContents.send).toHaveBeenCalledWith(channels.menu.formatRichText, {
      command: RichTextFormatCommand.FONT_SIZE,
      fontSize: expect.any(Number)
    });
    expect(mocks.focusedWindow.webContents.send).toHaveBeenCalledWith(channels.menu.formatRichText, {
      command: RichTextFormatCommand.FONT_FAMILY,
      noteFont: expect.any(String)
    });
    expect(mocks.focusedWindow.setFullScreen).toHaveBeenCalledWith(true);
  });

  it("uses macOS-specific menu placement, roles, accelerators, and app icon menu actions", () => {
    mocks.isMac = true;
    const menu = createMenubar({ onLockNotes: mocks.onLockNotes, onSecureLock: mocks.onSecureLock }) as unknown as MenuItem[];
    const appMenu = menu[0];
    const fileMenu = findMenuItem(menu, menuIds.file.root);

    expect(appMenu.label).toBe("Axion Notes");
    expect(appMenu.submenu?.some((item) => item.id === menuIds.app.settings)).toBe(true);
    expect(fileMenu?.submenu?.some((item) => item.id === menuIds.file.settings)).toBe(false);
    expect(fileMenu?.submenu?.some((item) => item.role === "close")).toBe(true);
    expect(findMenuItem(menu, menuIds.edit.delete)?.role).toBe("delete");
    expect(findMenuItem(menu, menuIds.view.toggleFullScreen)?.label).toBe("toggleFullScreen");

    findMenuItem(menu, menuIds.app.settings)?.click?.();
    findMenuItem(menu, menuIds.app.lockNotes)?.click?.();
    findMenuItem(menu, menuIds.app.secureLock)?.click?.();
    mocks.focusedWindow.isFullScreen.mockReturnValue(true);
    findMenuItem(menu, menuIds.view.toggleFullScreen)?.click?.();

    expect(mocks.createSettingsWindow).toHaveBeenCalledOnce();
    expect(mocks.onLockNotes).toHaveBeenCalledOnce();
    expect(mocks.onSecureLock).toHaveBeenCalledOnce();
    expect(mocks.focusedWindow.setFullScreen).toHaveBeenCalledWith(false);
  });

  it("does not throw when no window is focused", () => {
    mocks.getFocusedWindow.mockReturnValueOnce(undefined);
    const menu = createMenubar({ onLockNotes: mocks.onLockNotes, onSecureLock: mocks.onSecureLock }) as unknown as MenuItem[];

    expect(() => findMenuItem(menu, menuIds.file.newNote)?.click?.()).not.toThrow();
  });
});

function findMenuItem(items: MenuItem[], id: string): MenuItem | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }

    const child = item.submenu && findMenuItem(item.submenu, id);

    if (child) {
      return child;
    }
  }

  return undefined;
}

function invokeEveryMenuAction(items: MenuItem[]): void {
  for (const item of items) {
    item.click?.();

    if (item.submenu) {
      invokeEveryMenuAction(item.submenu);
    }
  }
}
