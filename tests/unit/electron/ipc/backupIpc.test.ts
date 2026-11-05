/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BackupState } from "../../../../src/types/BackupState";
import { channels } from "../../../../electron/ipc/channels";
import { registerBackupIpc } from "../../../../electron/ipc/backupIpc";
import { LockStateService } from "../../../../electron/security/LockStateService";
import { BackupService } from "../../../../electron/storage/BackupService";

const { handlers } = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>()
}));

vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler))
  }
}));

beforeEach(() => {
  handlers.clear();
  vi.restoreAllMocks();
});

describe("backup IPC lock boundary", () => {
  it("does not expose or initialize backups while locked", async () => {
    const backupService = {
      getState: vi.fn(),
      initialize: vi.fn()
    };
    registerBackupIpc({
      backupService: backupService as unknown as BackupService,
      lockStateService: { getIsLocked: vi.fn(() => true) } as unknown as LockStateService
    });

    await expect(invoke(channels.backup.getState)).resolves.toBeUndefined();
    await expect(invoke(channels.backup.initialize)).resolves.toBeUndefined();
    expect(backupService.getState).not.toHaveBeenCalled();
    expect(backupService.initialize).not.toHaveBeenCalled();
  });

  it("returns and initializes backup state while unlocked", async () => {
    const state = createBackupState();
    const backupService = {
      getState: vi.fn(async () => state),
      initialize: vi.fn(async () => state)
    };
    registerBackupIpc({
      backupService: backupService as unknown as BackupService,
      lockStateService: { getIsLocked: vi.fn(() => false) } as unknown as LockStateService
    });

    await expect(invoke(channels.backup.getState)).resolves.toEqual(state);
    await expect(invoke(channels.backup.initialize)).resolves.toEqual(state);
    expect(backupService.getState).toHaveBeenCalledOnce();
    expect(backupService.initialize).toHaveBeenCalledOnce();
  });
});

function createBackupState(): BackupState {
  return {
    version: 1,
    initializedAt: "2026-11-04T12:00:00.000Z",
    contentSelection: {
      appSettings: true,
      mainWindowState: true
    }
  };
}

async function invoke(channel: string): Promise<unknown> {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No IPC handler registered for ${channel}.`);
  }

  return handler({});
}
