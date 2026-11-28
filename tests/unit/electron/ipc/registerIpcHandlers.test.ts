/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerIpcHandlers } from "../../../../electron/ipc/registerIpcHandlers";

const mocks = vi.hoisted(() => ({
  applyMenuSettings: vi.fn(),
  registerAppWindowIpc: vi.fn(),
  registerBackupIpc: vi.fn(),
  registerClipboardIpc: vi.fn(),
  registerMenuIpc: vi.fn(),
  registerNoteSortIpc: vi.fn(),
  registerNoteWindowIpc: vi.fn(),
  registerRestoreIpc: vi.fn(),
  registerSecurityIpc: vi.fn(),
  registerSettingsIpc: vi.fn(),
  registerStorageIpc: vi.fn(),
  registerSystemThemeIpc: vi.fn(),
  setLockScreenActive: vi.fn(),
  setSecureLockAvailable: vi.fn(),
  setStorageMigrationActive: vi.fn()
}));

vi.mock("../../../../electron/ipc/appWindowIpc", () => ({ registerAppWindowIpc: mocks.registerAppWindowIpc }));
vi.mock("../../../../electron/ipc/backupIpc", () => ({ registerBackupIpc: mocks.registerBackupIpc }));
vi.mock("../../../../electron/ipc/clipboardIpc", () => ({ registerClipboardIpc: mocks.registerClipboardIpc }));
vi.mock("../../../../electron/ipc/menuIpc", () => ({
  applyMenuSettings: mocks.applyMenuSettings,
  registerMenuIpc: mocks.registerMenuIpc,
  setLockScreenActive: mocks.setLockScreenActive,
  setSecureLockAvailable: mocks.setSecureLockAvailable,
  setStorageMigrationActive: mocks.setStorageMigrationActive
}));
vi.mock("../../../../electron/ipc/noteSortIpc", () => ({ registerNoteSortIpc: mocks.registerNoteSortIpc }));
vi.mock("../../../../electron/ipc/noteWindowIpc", () => ({ registerNoteWindowIpc: mocks.registerNoteWindowIpc }));
vi.mock("../../../../electron/ipc/restoreIpc", () => ({ registerRestoreIpc: mocks.registerRestoreIpc }));
vi.mock("../../../../electron/ipc/securityIpc", () => ({ registerSecurityIpc: mocks.registerSecurityIpc }));
vi.mock("../../../../electron/ipc/settingsIpc", () => ({ registerSettingsIpc: mocks.registerSettingsIpc }));
vi.mock("../../../../electron/ipc/storageIpc", () => ({ registerStorageIpc: mocks.registerStorageIpc }));
vi.mock("../../../../electron/ipc/systemThemeIpc", () => ({ registerSystemThemeIpc: mocks.registerSystemThemeIpc }));

describe("IPC handler registration", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("registers every IPC surface and synchronizes initial menu state", () => {
    const options = createOptions();
    options.settingsService.getCachedSettings.mockReturnValue(options.settings);

    registerIpcHandlers(options.value);

    expect(mocks.registerBackupIpc).toHaveBeenCalledWith(expect.objectContaining({ backupService: options.backupService }));
    expect(mocks.registerClipboardIpc).toHaveBeenCalledWith(expect.objectContaining({ clipboardPrivacyService: options.clipboardPrivacyService }));
    expect(mocks.registerRestoreIpc).toHaveBeenCalledWith(expect.objectContaining({ restoreService: options.restoreService }));
    expect(mocks.registerAppWindowIpc).toHaveBeenCalledWith(expect.objectContaining({ mainWindowStateFilePath: "/settings/window.json" }));
    expect(mocks.registerSecurityIpc).toHaveBeenCalledWith(expect.objectContaining({ appSecurityDir: "/security" }));
    expect(mocks.registerStorageIpc).toHaveBeenCalledWith(expect.objectContaining({ appDataDir: "/data", appBackupDir: "/backup" }));
    expect(mocks.registerMenuIpc).toHaveBeenCalledOnce();
    expect(mocks.registerNoteSortIpc).toHaveBeenCalledOnce();
    expect(mocks.registerNoteWindowIpc).toHaveBeenCalledOnce();
    expect(mocks.registerSystemThemeIpc).toHaveBeenCalledOnce();
    expect(mocks.setLockScreenActive).toHaveBeenCalledWith(false);
    expect(mocks.setSecureLockAvailable).toHaveBeenCalledWith(true);
    expect(mocks.setStorageMigrationActive).toHaveBeenCalledWith(false);
    expect(mocks.applyMenuSettings).toHaveBeenCalledWith(options.settings);
  });

  it("propagates lock, cache, migration, and setting changes to their respective services", () => {
    const options = createOptions();
    registerIpcHandlers(options.value);
    const lockStateListener = options.lockStateService.onLockStateChange.mock.calls[0][0] as (state: { isLocked: boolean }) => void;
    const cacheListener = options.noteService.onPlaintextCacheStateChange.mock.calls[0][0] as (available: boolean) => void;
    const migrationListener = options.noteService.onStorageMigrationStateChange.mock.calls[0][0] as (active: boolean) => void;
    const settingsOptions = mocks.registerSettingsIpc.mock.calls[0][0] as { onSettingsChange: (settings: typeof options.settings) => void };
    const updatedSettings = { ...options.settings, clipboardClearDelay: 30 };

    lockStateListener({ isLocked: true });
    cacheListener(false);
    migrationListener(true);
    settingsOptions.onSettingsChange(updatedSettings);

    expect(mocks.setLockScreenActive).toHaveBeenLastCalledWith(true);
    expect(mocks.setSecureLockAvailable).toHaveBeenLastCalledWith(false);
    expect(mocks.setStorageMigrationActive).toHaveBeenLastCalledWith(true);
    expect(options.clipboardPrivacyService.applyClearDelay).toHaveBeenCalledWith(30);
    expect(options.lockStateService.applySettings).toHaveBeenCalledWith(updatedSettings);
    expect(mocks.applyMenuSettings).toHaveBeenLastCalledWith(updatedSettings);
    expect(options.onSettingsChange).toHaveBeenCalledWith(updatedSettings);
  });

  it("does not apply menu settings when no cached settings are available", () => {
    const options = createOptions();
    options.settingsService.getCachedSettings.mockReturnValue(undefined);

    registerIpcHandlers(options.value);

    expect(mocks.applyMenuSettings).not.toHaveBeenCalled();
  });
});

function createOptions() {
  const settings = { clipboardClearDelay: 0, noteLayout: "grid" };
  const backupService = {};
  const clipboardPrivacyService = { applyClearDelay: vi.fn() };
  const lockStateService = {
    applySettings: vi.fn(),
    getIsLocked: vi.fn(() => false),
    onLockStateChange: vi.fn(),
  };
  const noteService = {
    getIsStorageMigrationInProgress: vi.fn(() => false),
    hasPlaintextCache: vi.fn(() => true),
    onPlaintextCacheStateChange: vi.fn(),
    onStorageMigrationStateChange: vi.fn()
  };
  const restoreService = {};
  const settingsService = { getCachedSettings: vi.fn() };
  const onSettingsChange = vi.fn();

  return {
    backupService,
    clipboardPrivacyService,
    lockStateService,
    noteService,
    onSettingsChange,
    restoreService,
    settings,
    settingsService,
    value: {
      appBackupDir: "/backup",
      appDataDir: "/data",
      appSecurityDir: "/security",
      backupArchiveReader: {},
      backupArchiveService: {},
      backupService,
      clipboardPrivacyService,
      lockStateService,
      mainWindowStateFilePath: "/settings/window.json",
      noteService,
      onSettingsChange,
      passwordService: {},
      restoreService,
      restoreStateStorage: {},
      settingsService
    } as never
  };
}
