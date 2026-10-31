/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { vi } from "vitest";
import { IElectronAPI } from "../../../electron/types/preload";
import { NoteAccessStatus } from "../../../src/types/NoteAccessStatus";
import { defaultAppSettings } from "../../../src/settings/defaultSettings";

type DesktopApiMockOverrides = {
  [Property in keyof IElectronAPI]?: Partial<IElectronAPI[Property]>;
};

type DesktopApiTestWindow = Window & typeof globalThis & {
  api: IElectronAPI;
};

export function createDesktopApiMock(overrides: DesktopApiMockOverrides = {}): IElectronAPI {
  const unsubscribe = vi.fn();

  return mergeDesktopApiMock({
    appWindow: {
      close: vi.fn(),
      readyToShow: vi.fn(),
      restart: vi.fn(),
      setAlwaysOnTop: vi.fn(),
      setLayout: vi.fn()
    },
    storage: {
      getNotes: vi.fn().mockResolvedValue([]),
      getNotesWithAccessState: vi.fn().mockResolvedValue({
        status: NoteAccessStatus.AVAILABLE,
        notes: []
      }),
      getNotesFolderLocation: vi.fn().mockResolvedValue(""),
      setNote: vi.fn(),
      setNoteOrder: vi.fn(),
      deleteNote: vi.fn(),
      deleteAllNotes: vi.fn(),
      onNotesChange: vi.fn(() => unsubscribe)
    },
    menu: {
      onMenuNewNote: vi.fn(() => unsubscribe),
      onMenuSetNoteLayout: vi.fn(() => unsubscribe),
      onMenuSetNoteSortOrder: vi.fn(() => unsubscribe),
      onMenuResortNotes: vi.fn(() => unsubscribe),
      onMenuShowWelcome: vi.fn(() => unsubscribe),
      onMenuSelectNote: vi.fn(() => unsubscribe),
      onMenuSelectAllNotes: vi.fn(() => unsubscribe),
      onMenuCancelNoteSelection: vi.fn(() => unsubscribe),
      onMenuDeleteAllNotes: vi.fn(() => unsubscribe),
      onMenuRichTextFormat: vi.fn(() => unsubscribe),
      setDeleteAllNotesEnabled: vi.fn(),
      setEditSelectionState: vi.fn(),
      setNoteSelectionState: vi.fn(),
      setRichTextFormatState: vi.fn(),
      setNewNoteEnabled: vi.fn()
    },
    noteSort: {
      requestSort: vi.fn(),
      onSortRequest: vi.fn(() => unsubscribe),
      onSortApplied: vi.fn(() => unsubscribe)
    },
    noteWindow: {
      open: vi.fn(),
      onClosed: vi.fn(() => unsubscribe)
    },
    security: {
      changePassword: vi.fn().mockResolvedValue(true),
      clearPassword: vi.fn().mockResolvedValue(true),
      disableEncryption: vi.fn().mockResolvedValue(true),
      enableEncryption: vi.fn().mockResolvedValue(true),
      getLockState: vi.fn().mockResolvedValue({ isLocked: false }),
      getSecurityFolderLocation: vi.fn().mockResolvedValue(""),
      hasPassword: vi.fn().mockResolvedValue(false),
      lock: vi.fn().mockResolvedValue(true),
      onEncryptionProgress: vi.fn(() => unsubscribe),
      onLockStateChange: vi.fn(() => unsubscribe),
      onSecureLockComplete: vi.fn(() => unsubscribe),
      setPassword: vi.fn().mockResolvedValue(true),
      unlock: vi.fn().mockResolvedValue({ success: true }),
      verifyPassword: vi.fn().mockResolvedValue(true)
    },
    settings: {
      getSettings: vi.fn().mockResolvedValue(defaultAppSettings),
      getSettingsFolderLocation: vi.fn().mockResolvedValue(""),
      setSettings: vi.fn(),
      onSettingsChange: vi.fn(() => unsubscribe)
    },
    version: {
      getShortDisplayVersion: vi.fn(() => "v0.5.0-beta.1")
    },
    systemTheme: {
      onThemeChange: vi.fn(() => unsubscribe)
    },
    os: {
      isMac: false,
      isWindows: false
    }
  }, overrides);
}

export function installDesktopApiMock(overrides: DesktopApiMockOverrides = {}): IElectronAPI {
  const desktopApiMock = createDesktopApiMock(overrides);

  getTestWindow().api = desktopApiMock;

  return desktopApiMock;
}

function mergeDesktopApiMock(defaults: IElectronAPI, overrides: DesktopApiMockOverrides): IElectronAPI {
  return {
    ...defaults,
    ...overrides,
    appWindow: {
      ...defaults.appWindow,
      ...overrides.appWindow
    },
    storage: {
      ...defaults.storage,
      ...overrides.storage
    },
    menu: {
      ...defaults.menu,
      ...overrides.menu
    },
    noteSort: {
      ...defaults.noteSort,
      ...overrides.noteSort
    },
    noteWindow: {
      ...defaults.noteWindow,
      ...overrides.noteWindow
    },
    security: {
      ...defaults.security,
      ...overrides.security
    },
    settings: {
      ...defaults.settings,
      ...overrides.settings
    },
    version: {
      ...defaults.version,
      ...overrides.version
    },
    systemTheme: {
      ...defaults.systemTheme,
      ...overrides.systemTheme
    },
    os: {
      ...defaults.os,
      ...overrides.os
    }
  };
}

function getTestWindow(): DesktopApiTestWindow {
  return window as DesktopApiTestWindow;
}
