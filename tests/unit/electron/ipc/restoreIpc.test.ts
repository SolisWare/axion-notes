/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { registerRestoreIpc } from "../../../../electron/ipc/restoreIpc";
import { RestoreApplyStatus } from "../../../../src/types/RestoreApplyResult";
import { RestoreChooseStatus } from "../../../../src/types/RestoreChooseResult";
import { RestoreNotesMode } from "../../../../src/types/RestoreNotesMode";
import { RestoreSettingsMode } from "../../../../src/types/RestoreSettingsMode";

const { handlers, showOpenDialog } = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  showOpenDialog: vi.fn()
}));

vi.mock("electron", () => ({
  dialog: { showOpenDialog },
  ipcMain: { handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler)) }
}));

beforeEach(() => {
  handlers.clear();
  showOpenDialog.mockReset();
});

describe("restore IPC", () => {
  it("selects a user-chosen backup ZIP and applies a revalidated archive", async () => {
    const archive = { notes: [] };
    const backupArchiveReader = { readArchive: vi.fn().mockResolvedValue(archive) };
    const restoreService = { applyRestore: vi.fn().mockResolvedValue({ lastRestoredAt: "2026-11-07T12:00:00.000Z", version: 1 }) };
    registerRestoreIpc({
      backupArchiveReader,
      lockStateService: { getIsLocked: vi.fn(() => false) },
      noteService: { isEncryptionUnlocked: vi.fn(() => true) },
      restoreService
    } as never);
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ["/tmp/backup.zip"] });

    await expect(invoke(channels.restore.chooseArchive)).resolves.toEqual({ filePath: "/tmp/backup.zip", status: RestoreChooseStatus.SELECTED });
    await expect(invoke(channels.restore.apply, "/tmp/backup.zip", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.KEEP_CURRENT
    })).resolves.toEqual({ state: { lastRestoredAt: "2026-11-07T12:00:00.000Z", version: 1 }, status: RestoreApplyStatus.APPLIED });
    expect(backupArchiveReader.readArchive).toHaveBeenCalledWith("/tmp/backup.zip");
  });

  it("does not expose restore actions while the app is locked", async () => {
    const backupArchiveReader = { readArchive: vi.fn() };
    const restoreService = { applyRestore: vi.fn() };
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
});

async function invoke(channel: string, ...args: unknown[]): Promise<unknown> {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No IPC handler registered for ${channel}.`);
  }

  return handler({}, ...args);
}
