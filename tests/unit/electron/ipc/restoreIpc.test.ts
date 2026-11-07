/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { registerRestoreIpc } from "../../../../electron/ipc/restoreIpc";
import { BackupArchiveReadError, BackupArchiveReadFailure } from "../../../../electron/storage/BackupArchiveReader";
import { RestoreApplyStatus } from "../../../../src/types/RestoreApplyResult";
import { RestoreChooseStatus } from "../../../../src/types/RestoreChooseResult";
import { RestoreInspectStatus } from "../../../../src/types/RestoreInspectResult";
import { RestoreNotesMode } from "../../../../src/types/RestoreNotesMode";
import { RestoreSettingsMode } from "../../../../src/types/RestoreSettingsMode";

const { fromWebContents, handlers, showOpenDialog } = vi.hoisted(() => ({
  fromWebContents: vi.fn(() => undefined),
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  showOpenDialog: vi.fn()
}));

vi.mock("electron", () => ({
  BrowserWindow: { fromWebContents },
  dialog: { showOpenDialog },
  ipcMain: { handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler)) }
}));

beforeEach(() => {
  handlers.clear();
  fromWebContents.mockReset();
  fromWebContents.mockReturnValue(undefined);
  showOpenDialog.mockReset();
});

describe("restore IPC", () => {
  it("selects a user-chosen backup ZIP and applies a revalidated archive", async () => {
    const archive = { notes: [] };
    const backupArchiveReader = { readArchive: vi.fn().mockResolvedValue(archive) };
    const restoreService = {
      applyRestore: vi.fn().mockResolvedValue({ lastRestoredAt: "2026-11-07T12:00:00.000Z", version: 1 }),
      inspectRestore: vi.fn().mockResolvedValue({ incomingNotesCount: 1 })
    };
    registerRestoreIpc({
      backupArchiveReader,
      lockStateService: { getIsLocked: vi.fn(() => false) },
      noteService: { isEncryptionUnlocked: vi.fn(() => true) },
      restoreService
    } as never);
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ["/tmp/backup.zip"] });

    await expect(invoke(channels.restore.chooseArchive)).resolves.toEqual({ filePath: "/tmp/backup.zip", status: RestoreChooseStatus.SELECTED });
    await expect(invoke(channels.restore.inspect, "/tmp/backup.zip")).resolves.toEqual({ plan: { incomingNotesCount: 1 }, status: "ready" });
    await expect(invoke(channels.restore.apply, "/tmp/backup.zip", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.KEEP_CURRENT
    })).resolves.toEqual({ state: { lastRestoredAt: "2026-11-07T12:00:00.000Z", version: 1 }, status: RestoreApplyStatus.APPLIED });
    expect(backupArchiveReader.readArchive).toHaveBeenCalledWith("/tmp/backup.zip");
  });

  it("does not expose restore actions while the app is locked", async () => {
    const backupArchiveReader = { readArchive: vi.fn() };
    const restoreService = { applyRestore: vi.fn(), inspectRestore: vi.fn() };
    registerRestoreIpc({
      backupArchiveReader,
      lockStateService: { getIsLocked: vi.fn(() => true) },
      noteService: { isEncryptionUnlocked: vi.fn(() => true) },
      restoreService
    } as never);

    await expect(invoke(channels.restore.chooseArchive)).resolves.toEqual({ status: RestoreChooseStatus.FAILED });
    await expect(invoke(channels.restore.apply, "/tmp/backup.zip", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.KEEP_CURRENT
    })).resolves.toEqual({ status: RestoreApplyStatus.FAILED });
  });

  it("requires a password only for a locked encrypted library", async () => {
    const backupArchiveReader = { readArchive: vi.fn().mockResolvedValue({ notes: [] }) };
    const restoreService = { applyRestore: vi.fn(), inspectRestore: vi.fn() };
    const noteService = {
      isEncryptionUnlocked: vi.fn(() => false),
      verifyEncryptionPassword: vi.fn().mockResolvedValue(false)
    };
    registerRestoreIpc({
      backupArchiveReader,
      lockStateService: { getIsLocked: vi.fn(() => false) },
      noteService,
      restoreService
    } as never);

    await expect(invoke(channels.restore.inspect, "/tmp/backup.zip")).resolves.toEqual({ status: RestoreInspectStatus.PASSWORD_REQUIRED });
    await expect(invoke(channels.restore.inspect, "/tmp/backup.zip", "wrong-password")).resolves.toEqual({ status: RestoreInspectStatus.INVALID_PASSWORD });
    expect(restoreService.inspectRestore).not.toHaveBeenCalled();
  });

  it("reports an invalid archive separately from restore read or write failures", async () => {
    const invalidArchiveError = new BackupArchiveReadError(BackupArchiveReadFailure.INVALID_ARCHIVE, "Invalid archive");
    const backupArchiveReader = { readArchive: vi.fn().mockRejectedValueOnce(invalidArchiveError).mockRejectedValueOnce(new Error("Disk error")) };
    const restoreService = { applyRestore: vi.fn(), inspectRestore: vi.fn() };
    registerRestoreIpc({
      backupArchiveReader,
      lockStateService: { getIsLocked: vi.fn(() => false) },
      noteService: { isEncryptionUnlocked: vi.fn(() => true) },
      restoreService
    } as never);

    await expect(invoke(channels.restore.inspect, "/tmp/invalid.zip")).resolves.toEqual({ status: RestoreInspectStatus.INVALID_ARCHIVE });
    await expect(invoke(channels.restore.inspect, "/tmp/unreadable.zip")).resolves.toEqual({ status: RestoreInspectStatus.FAILED });
  });
});

async function invoke(channel: string, ...args: unknown[]): Promise<unknown> {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No IPC handler registered for ${channel}.`);
  }

  return handler({}, ...args);
}
