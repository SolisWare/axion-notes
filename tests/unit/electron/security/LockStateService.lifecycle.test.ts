/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindow } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LockStateService } from "../../../../electron/security/LockStateService";
import { NoteService } from "../../../../electron/storage/NoteService";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { LockScreenIdleTimeout } from "../../../../src/settings/LockScreenIdleTimeout";
import { LockScreenRequirePasswordDelay } from "../../../../src/settings/LockScreenRequirePasswordDelay";
import { UnlockResultStatus } from "../../../../src/types/UnlockResultStatus";

const { powerMonitor } = vi.hoisted(() => ({
  powerMonitor: {
    getSystemIdleTime: vi.fn(() => 0),
    on: vi.fn()
  }
}));

vi.mock("electron", () => ({
  powerMonitor
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-18T12:00:00.000Z"));
  powerMonitor.getSystemIdleTime.mockReturnValue(0);
  powerMonitor.on.mockClear();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("LockStateService lifecycle", () => {
  it("stays unlocked when no lock signal or password record exists", async () => {
    const context = createContext();

    await context.service.initialize(defaultAppSettings);

    expect(context.service.getLockState()).toMatchObject({
      isLocked: false,
      isRecoveryRequired: false
    });
    expect(context.lockMarkerService.writeLockMarker).not.toHaveBeenCalled();
  });

  it("initializes as locked and records the marker for a configured lock screen", async () => {
    const context = createContext({
      passwordService: {
        hasPassword: true,
        hasUsablePasswordRecord: true
      }
    });

    await context.service.initialize({
      ...defaultAppSettings,
      lockScreenEnabled: true
    });

    expect(context.service.getLockState()).toMatchObject({
      isLocked: true,
      isRecoveryRequired: false
    });
    expect(context.lockMarkerService.writeLockMarker).toHaveBeenCalledOnce();
  });

  it("enters recovery without attempting to verify an unusable configured password", async () => {
    const context = createContext({
      lockMarkerService: { hasLockMarker: true },
      passwordService: {
        hasPassword: true,
        hasUsablePasswordRecord: false
      }
    });

    await context.service.initialize(defaultAppSettings);

    expect(context.service.getLockState()).toMatchObject({
      isLocked: true,
      isRecoveryRequired: true
    });
    await expect(context.service.unlock("correct password")).resolves.toEqual({
      status: UnlockResultStatus.RECOVERY_REQUIRED
    });
    expect(context.passwordService.verifyPassword).not.toHaveBeenCalled();
  });

  it("flushes the editor, prepares the transition, notifies listeners, and forces the lock route", async () => {
    const context = createContext({
      passwordService: { hasUsablePasswordRecord: true }
    });
    const mainWindow = createMainWindow("file:///index.html#/main");
    const listener = vi.fn();
    context.service.registerMainWindow(mainWindow.window);
    context.service.applySettings({
      ...defaultAppSettings,
      lockScreenEnabled: true
    });
    context.service.onLockStateChange(listener);

    await expect(context.service.lock()).resolves.toBe(true);

    expect(mainWindow.executeJavaScript).toHaveBeenNthCalledWith(1, expect.stringContaining("activeElement.blur"), true);
    expect(mainWindow.executeJavaScript).toHaveBeenNthCalledWith(2, expect.stringContaining("axion-notes:prepare-lock"), true);
    expect(mainWindow.executeJavaScript).toHaveBeenNthCalledWith(3, 'window.location.hash = "#/main/lock";', true);
    expect(context.lockMarkerService.writeLockMarker).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ isLocked: true, isRecoveryRequired: false }));
  });

  it("blocks locking during storage migration and when no lock mechanism is configured", async () => {
    const migrating = createContext({ noteService: { getIsStorageMigrationInProgress: true } });
    migrating.service.applySettings({
      ...defaultAppSettings,
      lockScreenEnabled: true
    });

    await expect(migrating.service.lock()).resolves.toBe(false);

    const unconfigured = createContext();
    await expect(unconfigured.service.lock()).resolves.toBe(false);
  });

  it("securely locks encrypted notes and clears their plaintext cache", async () => {
    const context = createContext({
      noteService: {
        hasEncryptionRecord: true,
        hasPlaintextCache: true
      }
    });
    context.service.applySettings({
      ...defaultAppSettings,
      notesEncryptionEnabled: true
    });

    await expect(context.service.secureLock()).resolves.toBe(true);

    expect(context.service.getIsLocked()).toBe(true);
    expect(context.noteService.clearPlaintextCache).toHaveBeenCalledOnce();
  });

  it("honors the close-window password grace period before requiring a lock again", async () => {
    const context = createContext({
      passwordService: {
        hasPassword: true,
        hasUsablePasswordRecord: true,
        verifyPassword: true
      }
    });
    const settings = {
      ...defaultAppSettings,
      lockScreenEnabled: true,
      lockScreenRequirePasswordDelay: LockScreenRequirePasswordDelay.FIVE_SECONDS
    };
    const mainWindow = createMainWindow("file:///index.html#/main");

    await context.service.initialize(settings);
    await context.service.unlock("correct password");
    context.service.registerMainWindow(mainWindow.window);
    mainWindow.emit("closed");

    await context.service.refreshLockState(settings);
    expect(context.service.getIsLocked()).toBe(false);

    vi.advanceTimersByTime(5_000);
    await context.service.refreshLockState(settings);
    expect(context.service.getIsLocked()).toBe(true);
  });

  it("locks after the configured idle timeout and on system sleep", async () => {
    const context = createContext({
      passwordService: {
        hasPassword: true,
        hasUsablePasswordRecord: true,
        verifyPassword: true
      }
    });
    const settings = {
      ...defaultAppSettings,
      lockScreenEnabled: true,
      lockScreenIdleTimeout: LockScreenIdleTimeout.ONE_MINUTE
    };

    await context.service.initialize(settings);
    await context.service.unlock("correct password");
    powerMonitor.getSystemIdleTime.mockReturnValue(60);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(context.service.getIsLocked()).toBe(true);

    await context.service.unlock("correct password");
    const lockScreenHandler = powerMonitor.on.mock.calls.find(([event]) => event === "lock-screen")?.[1] as (() => void) | undefined;
    lockScreenHandler?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(context.service.getIsLocked()).toBe(true);
  });

  it("prevents reload shortcuts only while locked", async () => {
    const context = createContext({
      passwordService: {
        hasPassword: true,
        hasUsablePasswordRecord: true
      }
    });
    const mainWindow = createMainWindow("file:///index.html#/main/lock");
    context.service.registerMainWindow(mainWindow.window);
    await context.service.initialize({
      ...defaultAppSettings,
      lockScreenEnabled: true
    });
    const beforeInputHandler = mainWindow.webContentsOn.mock.calls.find(([event]) => event === "before-input-event")?.[1] as ((event: { preventDefault: () => void }, input: { key: string; meta?: boolean; control?: boolean }) => void) | undefined;
    const lockedEvent = { preventDefault: vi.fn() };

    beforeInputHandler?.(lockedEvent, { key: "F5" });
    beforeInputHandler?.(lockedEvent, { key: "r", control: true });

    expect(lockedEvent.preventDefault).toHaveBeenCalledTimes(2);
  });
});

type ContextOptions = {
  lockMarkerService?: Partial<Record<"hasLockMarker", boolean>>;
  noteService?: Partial<Record<"getIsStorageMigrationInProgress" | "hasEncryptionRecord" | "hasPlaintextCache", boolean>>;
  passwordService?: Partial<Record<"hasPassword" | "hasUsablePasswordRecord" | "verifyPassword", boolean>>;
};

function createContext(options: ContextOptions = {}) {
  const passwordService = {
    hasPassword: vi.fn(async () => options.passwordService?.hasPassword ?? false),
    hasUsablePasswordRecord: vi.fn(async () => options.passwordService?.hasUsablePasswordRecord ?? false),
    verifyPassword: vi.fn(async () => options.passwordService?.verifyPassword ?? false)
  };
  const bruteForceProtectionService = {
    getStatus: vi.fn(() => ({ isCooldownActive: false })),
    initialize: vi.fn(async () => undefined),
    recordFailedAttempt: vi.fn(async () => ({ isCooldownActive: false })),
    reset: vi.fn(async () => undefined)
  };
  const lockMarkerService = {
    hasLockMarker: vi.fn(async () => options.lockMarkerService?.hasLockMarker ?? false),
    removeLockMarker: vi.fn(async () => undefined),
    writeLockMarker: vi.fn(async () => undefined)
  };
  const noteService = {
    applyEncryptionSetting: vi.fn(),
    clearPlaintextCache: vi.fn(),
    getIsStorageMigrationInProgress: vi.fn(() => options.noteService?.getIsStorageMigrationInProgress ?? false),
    hasEncryptionRecord: vi.fn(async () => options.noteService?.hasEncryptionRecord ?? false),
    hasPlaintextCache: vi.fn(() => options.noteService?.hasPlaintextCache ?? false),
    unlockEncryption: vi.fn(async () => undefined)
  };

  return {
    lockMarkerService,
    noteService,
    passwordService,
    service: new LockStateService(
      passwordService as never,
      bruteForceProtectionService as never,
      lockMarkerService as never,
      noteService as unknown as NoteService
    )
  };
}

function createMainWindow(url: string): {
  emit: (event: string) => void;
  executeJavaScript: ReturnType<typeof vi.fn>;
  webContentsOn: ReturnType<typeof vi.fn>;
  window: BrowserWindow;
} {
  const windowListeners = new Map<string, () => void>();
  const executeJavaScript = vi.fn().mockResolvedValue(undefined);
  const webContentsOn = vi.fn();

  return {
    emit: (event) => windowListeners.get(event)?.(),
    executeJavaScript,
    webContentsOn,
    window: {
      isDestroyed: vi.fn(() => false),
      on: vi.fn((event: string, listener: () => void) => windowListeners.set(event, listener)),
      setContentProtection: vi.fn(),
      webContents: {
        executeJavaScript,
        getURL: vi.fn(() => url),
        isDestroyed: vi.fn(() => false),
        on: webContentsOn
      }
    } as unknown as BrowserWindow
  };
}
