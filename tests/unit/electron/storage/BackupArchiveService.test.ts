/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackupCreateStatus } from "../../../../src/types/BackupCreateResult";
import { BackupArchiveService, BACKUP_ARCHIVE_FILE_NAME } from "../../../../electron/storage/BackupArchiveService";
import { BackupStateStorage } from "../../../../electron/storage/BackupStateStorage";
import { NoteService } from "../../../../electron/storage/NoteService";
import { SettingsService } from "../../../../electron/storage/SettingsService";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("BackupArchiveService", () => {
  it("creates a managed ZIP archive and records its creation time", async () => {
    const { backupDirectory, noteService, service, stateStorage } = await createService(true);

    await stateStorage.setState({
      version: 1,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: {
        appSettings: false,
        mainWindowState: false
      }
    });

    await expect(service.createArchive()).resolves.toEqual({
      status: BackupCreateStatus.CREATED,
      state: {
        version: 1,
        initializedAt: "2026-11-05T12:00:00.000Z",
        contentSelection: {
          appSettings: false,
          mainWindowState: false
        },
        lastBackupCreatedAt: "2026-11-05T12:30:00.000Z"
      }
    });

    const archive = await fs.promises.readFile(path.join(backupDirectory, BACKUP_ARCHIVE_FILE_NAME));
    expect(archive.subarray(0, 2).toString("utf-8")).toBe("PK");
    expect(noteService.getNotesForBackup).toHaveBeenCalledWith(undefined);
  });

  it("requests an encryption password before reading a locked vault", async () => {
    const { noteService, service, stateStorage } = await createService(false);
    await stateStorage.setState({
      version: 1,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: {
        appSettings: false,
        mainWindowState: false
      }
    });

    await expect(service.createArchive()).resolves.toEqual({ status: BackupCreateStatus.PASSWORD_REQUIRED });
    expect(noteService.getNotesForBackup).not.toHaveBeenCalled();
  });

  it("replaces the managed archive when a new backup is created", async () => {
    const { backupDirectory, noteService, service, stateStorage } = await createService(true);
    await stateStorage.setState({
      version: 1,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: {
        appSettings: false,
        mainWindowState: false
      }
    });

    await expect(service.createArchive()).resolves.toMatchObject({ status: BackupCreateStatus.CREATED });
    await expect(service.createArchive()).resolves.toMatchObject({ status: BackupCreateStatus.CREATED });

    await expect(fs.promises.access(path.join(backupDirectory, BACKUP_ARCHIVE_FILE_NAME))).resolves.toBeUndefined();
    expect(noteService.getNotesForBackup).toHaveBeenCalledTimes(2);
  });
});

async function createService(isEncryptionUnlocked: boolean): Promise<{
  backupDirectory: string;
  noteService: { getNotesForBackup: ReturnType<typeof vi.fn>; isEncryptionUnlocked: ReturnType<typeof vi.fn> };
  service: BackupArchiveService;
  stateStorage: BackupStateStorage;
}> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-backup-archive-"));
  temporaryDirectories.push(directory);
  const backupDirectory = path.join(directory, "backup");
  const stateStorage = new BackupStateStorage(backupDirectory);
  const noteService = {
    getNotesForBackup: vi.fn(async () => [{
      id: "note-1",
      bgcolor: "yellow",
      content: "Backup content",
      createdOn: new Date("2026-11-05T12:00:00.000Z"),
      lastModifiedOn: new Date("2026-11-05T12:00:00.000Z")
    }]),
    isEncryptionUnlocked: vi.fn(() => isEncryptionUnlocked)
  };
  const settingsService = {
    getSettings: vi.fn()
  };

  return {
    backupDirectory,
    noteService,
    service: new BackupArchiveService(
      backupDirectory,
      stateStorage,
      noteService as unknown as NoteService,
      settingsService as unknown as SettingsService,
      path.join(directory, "main-window-state.json"),
      () => new Date("2026-11-05T12:30:00.000Z")
    ),
    stateStorage
  };
}
