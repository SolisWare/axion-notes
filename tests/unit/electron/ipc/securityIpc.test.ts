/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncryptionProgressOperation, EncryptionProgressPhase } from "../../../../src/types/EncryptionProgressEvent";
import { UnlockResultStatus } from "../../../../src/types/UnlockResultStatus";
import { channels } from "../../../../electron/ipc/channels";
import { registerSecurityIpc } from "../../../../electron/ipc/securityIpc";
import { LockStateService } from "../../../../electron/security/LockStateService";
import { PasswordService } from "../../../../electron/security/PasswordService";
import { NoteService } from "../../../../electron/storage/NoteService";
import { SettingsService } from "../../../../electron/storage/SettingsService";

const { handlers, lockStateListeners } = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  lockStateListeners: [] as Array<(lockState: unknown) => void>
}));

vi.mock("electron", () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => [])
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler))
  }
}));

beforeEach(() => {
  handlers.clear();
  lockStateListeners.splice(0);
  vi.restoreAllMocks();
});

describe("security IPC", () => {
  it("blocks protected security operations while locked", async () => {
    const options = createOptions({ isLocked: true });
    registerSecurityIpc(options.value);
    const event = createEvent();

    await expect(invoke<boolean>(channels.security.setPassword, event, "new password")).resolves.toBe(false);
    await expect(invoke<boolean>(channels.security.verifyPassword, event, "new password")).resolves.toBe(false);
    await expect(invoke<boolean>(channels.security.changePassword, event, "old password", "new password")).resolves.toBe(false);
    await expect(invoke<boolean>(channels.security.clearPassword, event)).resolves.toBe(false);
    await expect(invoke<boolean>(channels.security.enableEncryption, event, "new password")).resolves.toBe(false);
    await expect(invoke<boolean>(channels.security.disableEncryption, event, "new password")).resolves.toBe(false);
    await expect(invoke<string>(channels.security.getSecurityFolderLocation, event)).resolves.toBe("");

    expect(options.passwordService.setPassword).not.toHaveBeenCalled();
    expect(options.passwordService.verifyPassword).not.toHaveBeenCalled();
    expect(options.noteService.enableEncryption).not.toHaveBeenCalled();
    expect(options.noteService.disableEncryption).not.toHaveBeenCalled();
  });

  it("reports encryption progress without exposing the password", async () => {
    const options = createOptions();
    options.passwordService.verifyPassword.mockResolvedValue(true);
    options.noteService.enableEncryption.mockImplementation(async (_password: string, onProgress: (progress: unknown) => void) => {
      onProgress({
        operation: EncryptionProgressOperation.ENCRYPT,
        phase: EncryptionProgressPhase.PROCESSING_NOTES,
        current: 1,
        total: 1,
        progress: 80
      });
    });
    registerSecurityIpc(options.value);
    const event = createEvent();
    const password = "a password that must remain private";

    await expect(invoke<boolean>(channels.security.enableEncryption, event, password)).resolves.toBe(true);

    expect(options.passwordService.verifyPassword).toHaveBeenCalledWith(password);
    expect(options.noteService.enableEncryption).toHaveBeenCalledWith(password, expect.any(Function));
    expect(options.passwordService.clearPassword).toHaveBeenCalledOnce();
    expect(options.lockStateService.markLockConfigured).toHaveBeenCalledOnce();
    expect(event.sender.send).toHaveBeenCalledWith(channels.security.onEncryptionProgress, {
      operation: EncryptionProgressOperation.ENCRYPT,
      phase: EncryptionProgressPhase.PROCESSING_NOTES,
      current: 1,
      total: 1,
      progress: 80
    });
    expect(JSON.stringify(event.sender.send.mock.calls)).not.toContain(password);
  });

  it("returns a safe failure and does not log a password when a protected operation throws", async () => {
    const options = createOptions();
    const password = "do not log this password";
    options.passwordService.setPassword.mockRejectedValue(new Error(password));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    registerSecurityIpc(options.value);

    await expect(invoke<boolean>(channels.security.setPassword, createEvent(), password)).resolves.toBe(false);

    expect(warn).toHaveBeenCalledWith("Failed to set password.");
    expect(JSON.stringify(warn.mock.calls)).not.toContain(password);
  });

  it("keeps lock state and unlock available to the lock screen", async () => {
    const options = createOptions({ isLocked: true });
    options.lockStateService.getLockState.mockReturnValue({ isLocked: true, isRecoveryRequired: false });
    options.lockStateService.unlock.mockResolvedValue({ status: UnlockResultStatus.UNLOCKED });
    registerSecurityIpc(options.value);
    const event = createEvent();

    await expect(invoke(channels.security.getLockState, event)).resolves.toEqual({ isLocked: true, isRecoveryRequired: false });
    await expect(invoke(channels.security.unlock, event, "correct password")).resolves.toEqual({ status: UnlockResultStatus.UNLOCKED });
    expect(options.lockStateService.unlock).toHaveBeenCalledWith("correct password");
  });
});

function createOptions(overrides: { isLocked?: boolean } = {}) {
  const lockStateService = {
    getIsLocked: vi.fn(() => overrides.isLocked ?? false),
    getLockState: vi.fn(() => ({ isLocked: false, isRecoveryRequired: false })),
    lock: vi.fn(),
    unlock: vi.fn(),
    markLockConfigured: vi.fn(),
    clearLockConfigured: vi.fn(),
    onLockStateChange: vi.fn((listener: (lockState: unknown) => void) => {
      lockStateListeners.push(listener);
      return vi.fn();
    })
  };
  const passwordService = {
    hasPassword: vi.fn(async () => false),
    setPassword: vi.fn(async () => undefined),
    verifyPassword: vi.fn(async () => false),
    clearPassword: vi.fn(async () => undefined)
  };
  const noteService = {
    hasEncryptionRecord: vi.fn(async () => false),
    verifyEncryptionPassword: vi.fn(async () => false),
    changeEncryptionPassword: vi.fn(async () => undefined),
    enableEncryption: vi.fn(async () => undefined),
    disableEncryption: vi.fn(async () => undefined)
  };
  const settingsService = {
    getSettings: vi.fn(async () => undefined)
  };

  return {
    lockStateService,
    passwordService,
    noteService,
    value: {
      appSecurityDir: "/security",
      lockStateService: lockStateService as unknown as LockStateService,
      passwordService: passwordService as unknown as PasswordService,
      noteService: noteService as unknown as NoteService,
      settingsService: settingsService as unknown as SettingsService
    }
  };
}

function createEvent() {
  return {
    sender: {
      isDestroyed: vi.fn(() => false),
      send: vi.fn()
    }
  };
}

async function invoke<TResult>(channel: string, event: ReturnType<typeof createEvent>, ...args: unknown[]): Promise<TResult> {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No IPC handler registered for ${channel}.`);
  }

  return handler(event, ...args) as Promise<TResult>;
}
