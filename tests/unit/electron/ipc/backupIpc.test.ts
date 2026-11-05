/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BackupContentSelection } from "../../../../src/types/BackupContentSelection";
import { BackupCreateStatus } from "../../../../src/types/BackupCreateResult";
import { BackupState } from "../../../../src/types/BackupState";
import { channels } from "../../../../electron/ipc/channels";
import { registerBackupIpc } from "../../../../electron/ipc/backupIpc";
import { LockStateService } from "../../../../electron/security/LockStateService";
import { BackupService } from "../../../../electron/storage/BackupService";
import { BackupArchiveService } from "../../../../electron/storage/BackupArchiveService";

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
      initialize: vi.fn(),
      updateContentSelection: vi.fn()
    };
    const backupArchiveService = {
      createArchive: vi.fn()
    };
    registerBackupIpc({
      backupArchiveService: backupArchiveService as unknown as BackupArchiveService,
      backupService: backupService as unknown as BackupService,
      lockStateService: { getIsLocked: vi.fn(() => true) } as unknown as LockStateService
    });

    await expect(invoke(channels.backup.getState)).resolves.toBeUndefined();
    await expect(invoke(channels.backup.initialize)).resolves.toBeUndefined();
    await expect(invoke(channels.backup.updateContentSelection, { appSettings: false, mainWindowState: false })).resolves.toBeUndefined();
    await expect(invoke(channels.backup.createArchive)).resolves.toEqual({ status: BackupCreateStatus.FAILED });
    expect(backupService.getState).not.toHaveBeenCalled();
    expect(backupService.initialize).not.toHaveBeenCalled();
    expect(backupService.updateContentSelection).not.toHaveBeenCalled();
    expect(backupArchiveService.createArchive).not.toHaveBeenCalled();
  });

  it("returns and initializes backup state while unlocked", async () => {
    const state = createBackupState();
    const backupService = {
      getState: vi.fn(async () => state),
      initialize: vi.fn(async () => state),
      updateContentSelection: vi.fn(async (contentSelection: BackupContentSelection) => ({
        ...state,
        contentSelection
      }))
    };
    const backupArchiveService = {
      createArchive: vi.fn(async () => ({ status: BackupCreateStatus.CREATED, state }))
    };
    registerBackupIpc({
      backupArchiveService: backupArchiveService as unknown as BackupArchiveService,
      backupService: backupService as unknown as BackupService,
      lockStateService: { getIsLocked: vi.fn(() => false) } as unknown as LockStateService
    });

    await expect(invoke(channels.backup.getState)).resolves.toEqual(state);
    await expect(invoke(channels.backup.initialize)).resolves.toEqual(state);
    await expect(invoke(channels.backup.updateContentSelection, { appSettings: false, mainWindowState: true })).resolves.toEqual({
      ...state,
      contentSelection: { appSettings: false, mainWindowState: true }
    });
    await expect(invoke(channels.backup.createArchive, "backup password")).resolves.toEqual({ status: BackupCreateStatus.CREATED, state });
    expect(backupService.getState).toHaveBeenCalledOnce();
    expect(backupService.initialize).toHaveBeenCalledOnce();
    expect(backupService.updateContentSelection).toHaveBeenCalledWith({ appSettings: false, mainWindowState: true });
    expect(backupArchiveService.createArchive).toHaveBeenCalledWith("backup password");
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

async function invoke(channel: string, ...args: unknown[]): Promise<unknown> {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No IPC handler registered for ${channel}.`);
  }

  return handler({}, ...args);
}
