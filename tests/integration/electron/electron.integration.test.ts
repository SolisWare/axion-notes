/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteLayoutPreference } from "../../../src/settings/NoteLayoutPreference";

type AppEventHandler = (...args: never[]) => unknown;

const mocks = vi.hoisted(() => ({
  appEvents: new Map<string, AppEventHandler[]>(),
  appQuit: vi.fn(),
  appSetAboutPanelOptions: vi.fn(),
  appSetPath: vi.fn(),
  closeNoteWindows: vi.fn(),
  closeSettingsWindow: vi.fn(),
  createMainWindow: vi.fn(),
  createMenubar: vi.fn(),
  createSplashWindow: vi.fn(() => ({ isDestroyed: vi.fn(() => false) })),
  fsExistsSync: vi.fn(() => true),
  fsMkdirSync: vi.fn(),
  getAllWindows: vi.fn(() => []),
  getAppIconPath: vi.fn(() => "/app/icon.png"),
  getElectronLanguage: vi.fn(),
  getLocale: vi.fn(() => "en-GB"),
  isDev: false,
  isMac: false,
  lockStateChangeHandler: undefined as ((lockState: { isLocked: boolean }) => void) | undefined,
  lockStateService: {
    getIsLocked: vi.fn(() => false),
    initialize: vi.fn().mockResolvedValue(undefined),
    lock: vi.fn().mockResolvedValue(undefined),
    onLockStateChange: vi.fn(),
    refreshLockState: vi.fn().mockResolvedValue(undefined),
    secureLock: vi.fn().mockResolvedValue(true)
  },
  menuOptions: undefined as {
    onLockNotes: () => void;
    onSecureLock: () => void;
  } | undefined,
  registerClipboardPrivacyShutdown: vi.fn(),
  registerIpcHandlers: vi.fn(),
  registerStorageMigrationGuard: vi.fn(),
  resolvePreferredDateFormat: vi.fn(() => "day-month-year"),
  resolvePreferredLanguage: vi.fn(() => "en"),
  resolvePreferredTimeFormat: vi.fn(() => "12-hour"),
  securityPermissionCheckHandler: undefined as (() => boolean) | undefined,
  securityPermissionRequestHandler: undefined as ((contents: unknown, permission: string, callback: (allowed: boolean) => void) => void) | undefined,
  settingsService: {
    getSettings: vi.fn(),
    refreshSettings: vi.fn(),
    setSettings: vi.fn()
  },
  setApplicationMenu: vi.fn(),
  setElectronLanguage: vi.fn().mockResolvedValue(undefined),
  setIcon: vi.fn(),
  webContentsCreatedHandler: undefined as ((event: unknown, contents: { on: ReturnType<typeof vi.fn> }) => void) | undefined
}));

vi.mock("electron", () => ({
  app: {
    dock: { setIcon: mocks.setIcon },
    getLocale: mocks.getLocale,
    getPath: vi.fn(() => "/app/user-data"),
    on: vi.fn((event: string, handler: AppEventHandler) => {
      const handlers = mocks.appEvents.get(event) ?? [];
      handlers.push(handler);
      mocks.appEvents.set(event, handlers);
    }),
    quit: mocks.appQuit,
    setAboutPanelOptions: mocks.appSetAboutPanelOptions,
    setPath: mocks.appSetPath
  },
  BrowserWindow: {
    getAllWindows: mocks.getAllWindows
  },
  Menu: {
    setApplicationMenu: mocks.setApplicationMenu
  },
  session: {
    defaultSession: {
      setPermissionCheckHandler: vi.fn((handler) => {
        mocks.securityPermissionCheckHandler = handler;
      }),
      setPermissionRequestHandler: vi.fn((handler) => {
        mocks.securityPermissionRequestHandler = handler;
      })
    }
  }
}));

vi.mock("node:fs", () => ({
  existsSync: mocks.fsExistsSync,
  mkdirSync: mocks.fsMkdirSync
}));

vi.mock("../../../electron/menu", () => ({
  createMenubar: vi.fn((options) => {
    mocks.menuOptions = options;
    return { nativeMenu: true };
  })
}));

vi.mock("../../../electron/utils/isDev", () => ({
  get isDev() {
    return mocks.isDev;
  }
}));

vi.mock("../../../electron/utils/Platform", () => ({
  get isMac() {
    return mocks.isMac;
  }
}));

vi.mock("../../../electron/utils/appIcon", () => ({
  getAppIconPath: mocks.getAppIconPath
}));

vi.mock("../../../electron/utils/electronI18n", () => ({
  setElectronLanguage: mocks.setElectronLanguage
}));

vi.mock("../../../electron/windows/createMainWindow", () => ({
  createMainWindow: mocks.createMainWindow
}));

vi.mock("../../../electron/windows/createNoteWindow", () => ({
  closeNoteWindows: mocks.closeNoteWindows
}));

vi.mock("../../../electron/windows/createSettingsWindow", () => ({
  closeSettingsWindow: mocks.closeSettingsWindow
}));

vi.mock("../../../electron/windows/createSplashWindow", () => ({
  createSplashWindow: mocks.createSplashWindow
}));

vi.mock("../../../electron/ipc/registerIpcHandlers", () => ({
  registerIpcHandlers: mocks.registerIpcHandlers
}));

vi.mock("../../../electron/security/clipboardPrivacyShutdown", () => ({
  registerClipboardPrivacyShutdown: mocks.registerClipboardPrivacyShutdown
}));

vi.mock("../../../electron/storage/StorageMigrationGuard", () => ({
  registerStorageMigrationGuard: mocks.registerStorageMigrationGuard
}));

vi.mock("../../../electron/storage/SettingsService", () => ({
  SettingsService: vi.fn(function SettingsService() {
    return mocks.settingsService;
  })
}));

vi.mock("../../../electron/security/LockStateService", () => ({
  LockStateService: vi.fn(function LockStateService() {
    return mocks.lockStateService;
  })
}));

vi.mock("../../../electron/security/BruteForceProtectionService", () => ({ BruteForceProtectionService: vi.fn() }));
vi.mock("../../../electron/security/ClipboardPrivacyService", () => ({ ClipboardPrivacyService: vi.fn(function ClipboardPrivacyService() {
  return { applyClearDelay: vi.fn(), clearTrackedNoteCopy: vi.fn() };
}) }));
vi.mock("../../../electron/security/EncryptionKeyService", () => ({ EncryptionKeyService: vi.fn() }));
vi.mock("../../../electron/security/EncryptionService", () => ({ EncryptionService: vi.fn() }));
vi.mock("../../../electron/security/LockMarkerService", () => ({ LockMarkerService: vi.fn() }));
vi.mock("../../../electron/security/PasswordService", () => ({ PasswordService: vi.fn() }));
vi.mock("../../../electron/storage/BackupArchiveReader", () => ({ BackupArchiveReader: vi.fn() }));
vi.mock("../../../electron/storage/BackupArchiveService", () => ({ BackupArchiveService: vi.fn() }));
vi.mock("../../../electron/storage/BackupService", () => ({ BackupService: vi.fn() }));
vi.mock("../../../electron/storage/BackupStateStorage", () => ({ BackupStateStorage: vi.fn() }));
vi.mock("../../../electron/storage/NoteService", () => ({ NoteService: vi.fn() }));
vi.mock("../../../electron/storage/RestoreService", () => ({ RestoreService: vi.fn() }));
vi.mock("../../../electron/storage/RestoreStateStorage", () => ({ RestoreStateStorage: vi.fn() }));

vi.mock("../../../src/i18n/languageConfig", () => ({
  DEFAULT_LANGUAGE: "en",
  resolvePreferredSupportedLanguageCode: mocks.resolvePreferredLanguage
}));
vi.mock("../../../src/utils/dt-formatter/dateFormatConfig", () => ({
  resolvePreferredDateFormat: mocks.resolvePreferredDateFormat
}));
vi.mock("../../../src/utils/dt-formatter/timeFormatConfig", () => ({
  resolvePreferredTimeFormat: mocks.resolvePreferredTimeFormat
}));
vi.mock("../../../src/utils/app-version/AppVersionResolver", () => ({
  AppVersionResolver: {
    getAboutVersion: vi.fn(() => undefined),
    getCombinedVersion: vi.fn(() => "0.5.0-test")
  }
}));

beforeEach(async () => {
  vi.resetModules();
  mocks.appEvents.clear();
  mocks.appQuit.mockClear();
  mocks.appSetAboutPanelOptions.mockClear();
  mocks.appSetPath.mockClear();
  mocks.closeNoteWindows.mockClear();
  mocks.closeSettingsWindow.mockClear();
  mocks.createMainWindow.mockClear();
  mocks.createMenubar.mockClear();
  mocks.createSplashWindow.mockClear();
  mocks.fsExistsSync.mockReset();
  mocks.fsExistsSync.mockReturnValue(true);
  mocks.fsMkdirSync.mockClear();
  mocks.getAllWindows.mockReset();
  mocks.getAllWindows.mockReturnValue([]);
  mocks.getAppIconPath.mockClear();
  mocks.getLocale.mockClear();
  mocks.isDev = false;
  mocks.isMac = false;
  mocks.lockStateChangeHandler = undefined;
  mocks.lockStateService.getIsLocked.mockReset();
  mocks.lockStateService.getIsLocked.mockReturnValue(false);
  mocks.lockStateService.initialize.mockReset();
  mocks.lockStateService.initialize.mockResolvedValue(undefined);
  mocks.lockStateService.lock.mockReset();
  mocks.lockStateService.lock.mockResolvedValue(undefined);
  mocks.lockStateService.onLockStateChange.mockReset();
  mocks.lockStateService.onLockStateChange.mockImplementation((handler) => {
    mocks.lockStateChangeHandler = handler;
  });
  mocks.lockStateService.refreshLockState.mockReset();
  mocks.lockStateService.refreshLockState.mockResolvedValue(undefined);
  mocks.lockStateService.secureLock.mockReset();
  mocks.lockStateService.secureLock.mockResolvedValue(true);
  mocks.menuOptions = undefined;
  mocks.registerClipboardPrivacyShutdown.mockClear();
  mocks.registerIpcHandlers.mockClear();
  mocks.registerStorageMigrationGuard.mockClear();
  mocks.securityPermissionCheckHandler = undefined;
  mocks.securityPermissionRequestHandler = undefined;
  mocks.settingsService.getSettings.mockReset();
  mocks.settingsService.getSettings.mockResolvedValue(undefined);
  mocks.settingsService.refreshSettings.mockReset();
  mocks.settingsService.refreshSettings.mockResolvedValue(undefined);
  mocks.settingsService.setSettings.mockClear();
  mocks.setApplicationMenu.mockClear();
  mocks.setElectronLanguage.mockClear();
  mocks.setIcon.mockClear();
  mocks.webContentsCreatedHandler = undefined;
  await import("../../../electron/electron");
});

describe("Electron application bootstrap", () => {
  it("initializes security defaults, services, menu, IPC, splash, and main window on ready", async () => {
    mocks.fsExistsSync.mockReturnValue(false);
    await emitAppEvent("ready");

    expect(mocks.securityPermissionCheckHandler?.()).toBe(false);
    const permissionCallback = vi.fn();
    mocks.securityPermissionRequestHandler?.({}, "notifications", permissionCallback);
    expect(permissionCallback).toHaveBeenCalledWith(false);
    expect(mocks.setElectronLanguage).toHaveBeenCalledWith("en");
    expect(mocks.settingsService.setSettings).toHaveBeenCalledWith(expect.objectContaining({
      dateFormat: "day-month-year",
      language: "en",
      timeFormat: "12-hour"
    }));
    expect(mocks.registerStorageMigrationGuard).toHaveBeenCalledOnce();
    expect(mocks.registerClipboardPrivacyShutdown).toHaveBeenCalledOnce();
    expect(mocks.setApplicationMenu).toHaveBeenCalledWith({ nativeMenu: true });
    expect(mocks.registerIpcHandlers).toHaveBeenCalledWith(expect.objectContaining({
      lockStateService: mocks.lockStateService,
      onSettingsChange: expect.any(Function),
      settingsService: mocks.settingsService
    }));
    expect(mocks.createMainWindow).toHaveBeenCalledWith(expect.objectContaining({
      initialNoteLayout: NoteLayoutPreference.GRID,
      lockStateService: mocks.lockStateService
    }));
    expect(mocks.createSplashWindow).toHaveBeenCalledOnce();
  });

  it("blocks webviews, quits after the last non-macOS window, and keeps the app open on macOS", async () => {
    const contents = { on: vi.fn() };
    emitAppEvent("web-contents-created", {}, contents as never);
    const webviewHandler = contents.on.mock.calls[0][1] as (event: { preventDefault: ReturnType<typeof vi.fn> }) => void;
    const webviewEvent = { preventDefault: vi.fn() };
    webviewHandler(webviewEvent);

    emitAppEvent("window-all-closed");
    expect(webviewEvent.preventDefault).toHaveBeenCalledOnce();
    expect(mocks.appQuit).toHaveBeenCalledOnce();

    mocks.isMac = true;
    emitAppEvent("window-all-closed");
    expect(mocks.appQuit).toHaveBeenCalledOnce();
  });

  it("routes lock events and menu actions through the initialized lock service", async () => {
    await emitAppEvent("ready");
    const liveWindow = { isDestroyed: vi.fn(() => false), webContents: { isDestroyed: vi.fn(() => false), send: vi.fn() } };
    const destroyedWindow = { isDestroyed: vi.fn(() => true), webContents: { isDestroyed: vi.fn(() => true), send: vi.fn() } };
    mocks.getAllWindows.mockReturnValue([liveWindow, destroyedWindow]);

    mocks.lockStateChangeHandler?.({ isLocked: true });
    mocks.menuOptions?.onLockNotes();
    mocks.menuOptions?.onSecureLock();
    await Promise.resolve();

    expect(mocks.closeNoteWindows).toHaveBeenCalledOnce();
    expect(mocks.closeSettingsWindow).toHaveBeenCalledOnce();
    expect(mocks.lockStateService.lock).toHaveBeenCalledOnce();
    expect(mocks.lockStateService.secureLock).toHaveBeenCalledOnce();
    expect(liveWindow.webContents.send).toHaveBeenCalledWith("security.onSecureLockComplete");
    expect(destroyedWindow.webContents.send).not.toHaveBeenCalled();
  });

  it("keeps the secure-lock completion private when the lock operation does not complete", async () => {
    await emitAppEvent("ready");
    const liveWindow = { isDestroyed: vi.fn(() => false), webContents: { isDestroyed: vi.fn(() => false), send: vi.fn() } };
    mocks.getAllWindows.mockReturnValue([liveWindow]);
    mocks.lockStateService.secureLock.mockResolvedValue(false);

    mocks.menuOptions?.onSecureLock();
    await Promise.resolve();

    expect(liveWindow.webContents.send).not.toHaveBeenCalled();
  });

  it("does not recreate a window before startup has initialized its services", async () => {
    await emitAppEvent("activate");

    expect(mocks.createSplashWindow).not.toHaveBeenCalled();
    expect(mocks.createMainWindow).not.toHaveBeenCalled();
  });

  it("updates the current settings through IPC and applies the dock icon on macOS", async () => {
    mocks.isMac = true;
    mocks.settingsService.getSettings.mockResolvedValue({
      lockScreenEnabled: false,
      noteLayout: NoteLayoutPreference.LIST
    });
    await emitAppEvent("ready");

    expect(mocks.setIcon).toHaveBeenCalledWith("/app/icon.png");
    const ipcOptions = mocks.registerIpcHandlers.mock.calls[0][0] as {
      onSettingsChange: (settings: { noteLayout: NoteLayoutPreference }) => void;
    };
    ipcOptions.onSettingsChange({ noteLayout: NoteLayoutPreference.LIST });
    mocks.getAllWindows.mockReturnValue([]);

    await emitAppEvent("activate");

    expect(mocks.createMainWindow).toHaveBeenLastCalledWith(expect.objectContaining({
      initialNoteLayout: NoteLayoutPreference.LIST
    }));
  });

  it("recreates the main window from current settings after activation and refreshes lock-sensitive settings", async () => {
    mocks.settingsService.getSettings.mockResolvedValue({
      lockScreenEnabled: true,
      noteLayout: NoteLayoutPreference.LIST
    });
    mocks.settingsService.refreshSettings.mockResolvedValue({
      lockScreenEnabled: true,
      noteLayout: NoteLayoutPreference.LIST
    });
    await emitAppEvent("ready");
    mocks.getAllWindows.mockReturnValue([]);

    await emitAppEvent("activate");

    expect(mocks.settingsService.refreshSettings).toHaveBeenCalledOnce();
    expect(mocks.lockStateService.refreshLockState).toHaveBeenCalledWith(expect.objectContaining({ lockScreenEnabled: true }));
    expect(mocks.createMainWindow).toHaveBeenLastCalledWith(expect.objectContaining({ initialNoteLayout: NoteLayoutPreference.LIST }));
    expect(mocks.createMainWindow).toHaveBeenCalledTimes(2);
  });
});

async function emitAppEvent(event: string, ...args: never[]): Promise<void> {
  const handlers = mocks.appEvents.get(event) ?? [];

  for (const handler of handlers) {
    await handler(...args);
  }
}
