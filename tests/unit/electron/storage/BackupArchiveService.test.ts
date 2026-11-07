/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { BackupCreateStatus } from "../../../../src/types/BackupCreateResult";
import { BackupDeleteStatus } from "../../../../src/types/BackupDeleteResult";
import { BackupSource } from "../../../../src/types/BackupSource";
import { BackupArchiveService, BACKUP_ARCHIVE_FILE_NAME } from "../../../../electron/storage/BackupArchiveService";
import { BackupArchiveReader } from "../../../../electron/storage/BackupArchiveReader";
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

    const entries = await readArchiveEntries(path.join(backupDirectory, BACKUP_ARCHIVE_FILE_NAME));
    expect([...entries.keys()]).toEqual(["manifest.json", "notes.json", "note-order.json"]);
    expect(parseEntry(entries, "manifest.json")).toEqual({
      version: 1,
      createdAt: "2026-11-05T12:30:00.000Z",
      contentSelection: {
        appSettings: false,
        mainWindowState: false
      },
      source: BackupSource.DESKTOP
    });
    expect(parseEntry(entries, "notes.json")).toEqual([{
      id: "note-1",
      bgcolor: "yellow",
      content: "Backup content",
      createdOn: "2026-11-05T12:00:00.000Z",
      lastModifiedOn: "2026-11-05T12:00:00.000Z"
    }]);
    expect(parseEntry(entries, "note-order.json")).toEqual(["note-1"]);
    expect(noteService.getNotesForBackup).toHaveBeenCalledWith(undefined);
  });

  it("creates an archive that can be read back for restore", async () => {
    const { backupDirectory, service, settingsService, stateStorage } = await createService(true);
    settingsService.getSettings.mockResolvedValue({
      ...defaultAppSettings,
      noteContentFontSize: 14,
      noteTitleFont: "system",
      noteTitleFontSize: 16,
      showNoteTitles: true
    });
    await stateStorage.setState({
      version: 1,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      }
    });

    await expect(service.createArchive()).resolves.toMatchObject({ status: BackupCreateStatus.CREATED });
    await expect(new BackupArchiveReader().readArchive(path.join(backupDirectory, BACKUP_ARCHIVE_FILE_NAME))).resolves.toMatchObject({
      noteOrder: ["note-1"],
      notes: [{ content: "Backup content", id: "note-1" }]
    });
  });

  it("archives selected app preferences and main-window state without security settings", async () => {
    const { mainWindowStateFilePath, noteService, service, settingsService, stateStorage, backupDirectory } = await createService(true);
    const settings = {
      ...defaultAppSettings,
      bruteForceProtectionEnabled: true,
      lockScreenContentProtectionEnabled: true,
      lockScreenEnabled: true,
      lockScreenIdleTimeout: 60,
      lockScreenOnSystemSleepEnabled: true,
      lockScreenRequirePasswordDelay: 30,
      notesEncryptionEnabled: true
    };
    noteService.getNotesForBackup.mockResolvedValueOnce([{
      id: "note-2",
      bgcolor: "green",
      content: "Selected content",
      createdOn: new Date("2026-11-05T12:01:00.000Z"),
      lastModifiedOn: new Date("2026-11-05T12:02:00.000Z")
    }]);
    settingsService.getSettings.mockResolvedValueOnce(settings);
    await fs.promises.writeFile(mainWindowStateFilePath, JSON.stringify({
      bounds: { height: 500, width: 700, x: 10, y: 20 },
      isMaximized: true
    }), "utf-8");
    await stateStorage.setState({
      version: 1,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      }
    });

    await expect(service.createArchive()).resolves.toMatchObject({ status: BackupCreateStatus.CREATED });

    const entries = await readArchiveEntries(path.join(backupDirectory, BACKUP_ARCHIVE_FILE_NAME));
    expect([...entries.keys()]).toEqual([
      "manifest.json",
      "notes.json",
      "note-order.json",
      "app-preferences.json",
      "main-window-state.json"
    ]);
    const preferences = parseEntry(entries, "app-preferences.json") as Record<string, unknown>;
    expect(preferences).toMatchObject({
      dateFormat: settings.dateFormat,
      language: settings.language,
      noteLayout: settings.noteLayout,
      theme: settings.theme
    });
    expect(preferences).not.toHaveProperty("bruteForceProtectionEnabled");
    expect(preferences).not.toHaveProperty("lockScreenContentProtectionEnabled");
    expect(preferences).not.toHaveProperty("lockScreenEnabled");
    expect(preferences).not.toHaveProperty("lockScreenIdleTimeout");
    expect(preferences).not.toHaveProperty("lockScreenOnSystemSleepEnabled");
    expect(preferences).not.toHaveProperty("lockScreenRequirePasswordDelay");
    expect(preferences).not.toHaveProperty("notesEncryptionEnabled");
    expect(parseEntry(entries, "main-window-state.json")).toEqual({
      bounds: { height: 500, width: 700, x: 10, y: 20 },
      isMaximized: true
    });
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

  it("saves a copy of the managed archive to the selected destination", async () => {
    const { backupDirectory, service, stateStorage } = await createService(true);
    const destinationPath = path.join(backupDirectory, "exported-backup.zip");
    await stateStorage.setState({
      version: 1,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: {
        appSettings: false,
        mainWindowState: false
      }
    });
    await service.createArchive();

    await expect(service.saveCopy(destinationPath)).resolves.toEqual({ status: "saved" });
    await expect(fs.promises.readFile(destinationPath)).resolves.toEqual(
      await fs.promises.readFile(path.join(backupDirectory, BACKUP_ARCHIVE_FILE_NAME))
    );
  });

  it("deletes the managed archive while retaining its configuration", async () => {
    const { backupDirectory, service, stateStorage } = await createService(true);
    await stateStorage.setState({
      version: 1,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: false
      }
    });
    await service.createArchive();

    await expect(service.deleteArchive()).resolves.toEqual({
      status: BackupDeleteStatus.DELETED,
      state: {
        version: 1,
        initializedAt: "2026-11-05T12:00:00.000Z",
        contentSelection: {
          appSettings: true,
          mainWindowState: false
        }
      }
    });
    await expect(fs.promises.access(path.join(backupDirectory, BACKUP_ARCHIVE_FILE_NAME))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stateStorage.getState()).resolves.toEqual({
      version: 1,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: false
      }
    });
  });
});

async function createService(isEncryptionUnlocked: boolean): Promise<{
  backupDirectory: string;
  mainWindowStateFilePath: string;
  noteService: { getNotesForBackup: ReturnType<typeof vi.fn>; isEncryptionUnlocked: ReturnType<typeof vi.fn> };
  service: BackupArchiveService;
  settingsService: { getSettings: ReturnType<typeof vi.fn> };
  stateStorage: BackupStateStorage;
}> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-backup-archive-"));
  temporaryDirectories.push(directory);
  const backupDirectory = path.join(directory, "backup");
  const mainWindowStateFilePath = path.join(directory, "main-window-state.json");
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
    getSettings: vi.fn().mockResolvedValue(defaultAppSettings)
  };

  return {
    backupDirectory,
    mainWindowStateFilePath,
    noteService,
    service: new BackupArchiveService(
      backupDirectory,
      stateStorage,
      noteService as unknown as NoteService,
      settingsService as unknown as SettingsService,
      mainWindowStateFilePath,
      () => new Date("2026-11-05T12:30:00.000Z")
    ),
    settingsService,
    stateStorage
  };
}

async function readArchiveEntries(archivePath: string): Promise<Map<string, Buffer>> {
  const archive = await fs.promises.readFile(archivePath);
  const endOfCentralDirectoryOffset = findEndOfCentralDirectoryOffset(archive);
  const entries = new Map<string, Buffer>();
  let offset = archive.readUInt32LE(endOfCentralDirectoryOffset + 16);
  const entryCount = archive.readUInt16LE(endOfCentralDirectoryOffset + 10);

  for (let index = 0; index < entryCount; index += 1) {
    expect(archive.readUInt32LE(offset)).toBe(0x02014b50);
    const compressionMethod = archive.readUInt16LE(offset + 10);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const fileNameLength = archive.readUInt16LE(offset + 28);
    const extraFieldLength = archive.readUInt16LE(offset + 30);
    const fileCommentLength = archive.readUInt16LE(offset + 32);
    const localFileHeaderOffset = archive.readUInt32LE(offset + 42);
    const fileName = archive.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf-8");
    const localFileNameLength = archive.readUInt16LE(localFileHeaderOffset + 26);
    const localExtraFieldLength = archive.readUInt16LE(localFileHeaderOffset + 28);
    const compressedDataOffset = localFileHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
    const compressedData = archive.subarray(compressedDataOffset, compressedDataOffset + compressedSize);

    entries.set(fileName, compressionMethod === 8 ? zlib.inflateRawSync(compressedData) : compressedData);
    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
}

function findEndOfCentralDirectoryOffset(archive: Buffer): number {
  for (let offset = archive.length - 22; offset >= 0; offset -= 1) {
    if (archive.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error("The archive has no end of central directory record.");
}

function parseEntry(entries: Map<string, Buffer>, fileName: string): unknown {
  const entry = entries.get(fileName);

  if (!entry) {
    throw new Error(`The archive does not contain ${fileName}.`);
  }

  return JSON.parse(entry.toString("utf-8"));
}
