/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import yazl from "yazl";
import { BACKUP_ARCHIVE_FILE_NAME, createBackupArchiveEntries } from "../../src/backup/backupArchive";
import { BackupCreateResult, BackupCreateStatus } from "../../src/types/BackupCreateResult";
import { BackupDeleteResult, BackupDeleteStatus } from "../../src/types/BackupDeleteResult";
import { BackupSaveResult, BackupSaveStatus } from "../../src/types/BackupSaveResult";
import { BackupState } from "../../src/types/BackupState";
import { BackupSource } from "../../src/types/BackupSource";
import { NoteType } from "../../src/types/NoteType";
import { readMainWindowState } from "../windows/mainWindowState";
import { NoteService } from "./NoteService";
import { SettingsService } from "./SettingsService";
import { BackupStateStorage } from "./BackupStateStorage";

export { BACKUP_ARCHIVE_FILE_NAME } from "../../src/backup/backupArchive";

/**
 * Creates the managed plaintext backup archive in the Electron main process.
 */
export class BackupArchiveService {
  public constructor(
    private readonly backupDirectory: string,
    private readonly backupStateStorage: BackupStateStorage,
    private readonly noteService: NoteService,
    private readonly settingsService: SettingsService,
    private readonly mainWindowStateFilePath: string,
    private readonly getCurrentDate: () => Date = () => new Date()
  ) {
  }

  /**
   * Creates or replaces the managed archive using the saved content selection.
   */
  public async createArchive(password?: string): Promise<BackupCreateResult> {
    const state = await this.backupStateStorage.getState();

    if (!state) {
      return { status: BackupCreateStatus.FAILED };
    }

    if (!this.noteService.isEncryptionUnlocked() && !password) {
      return { status: BackupCreateStatus.PASSWORD_REQUIRED };
    }

    let notes: NoteType[];

    try {
      notes = await this.noteService.getNotesForBackup(password);
    } catch {
      return { status: BackupCreateStatus.INVALID_PASSWORD };
    }

    const createdAt = this.getCurrentDate().toISOString();

    try {
      await this.writeArchive(state, notes, createdAt);
      const updatedState: BackupState = {
        ...state,
        lastBackupCreatedAt: createdAt
      };
      await this.backupStateStorage.setState(updatedState);

      return {
        status: BackupCreateStatus.CREATED,
        state: updatedState
      };
    } catch (err) {
      console.warn("Failed to create backup archive:", err);
      return { status: BackupCreateStatus.FAILED };
    }
  }

  /**
   * Copies the managed archive to a user-selected location.
   */
  public async saveCopy(destinationPath: string): Promise<BackupSaveResult> {
    const archivePath = path.join(this.backupDirectory, BACKUP_ARCHIVE_FILE_NAME);

    try {
      await fs.promises.copyFile(archivePath, destinationPath);
      return { status: BackupSaveStatus.SAVED };
    } catch (err) {
      console.warn("Failed to save a backup copy:", err);
      return { status: BackupSaveStatus.FAILED };
    }
  }

  /**
   * Removes the managed archive while retaining backup configuration.
   */
  public async deleteArchive(): Promise<BackupDeleteResult> {
    const state = await this.backupStateStorage.getState();

    if (!state?.lastBackupCreatedAt) {
      return { status: BackupDeleteStatus.FAILED };
    }

    try {
      await fs.promises.rm(path.join(this.backupDirectory, BACKUP_ARCHIVE_FILE_NAME), { force: true });
      const { lastBackupCreatedAt: _lastBackupCreatedAt, ...updatedState } = state;
      await this.backupStateStorage.setState(updatedState);

      return {
        status: BackupDeleteStatus.DELETED,
        state: updatedState
      };
    } catch (err) {
      console.warn("Failed to delete backup archive:", err);
      return { status: BackupDeleteStatus.FAILED };
    }
  }

  private async writeArchive(state: BackupState, notes: NoteType[], createdAt: string): Promise<void> {
    await fs.promises.mkdir(this.backupDirectory, { recursive: true });

    const archivePath = path.join(this.backupDirectory, BACKUP_ARCHIVE_FILE_NAME);
    const temporaryArchivePath = `${archivePath}.tmp`;
    const zip = new yazl.ZipFile();
    const output = fs.createWriteStream(temporaryArchivePath);
    const completion = new Promise<void>((resolve, reject) => {
      output.once("close", resolve);
      output.once("error", reject);
      zip.outputStream.once("error", reject);
    });

    zip.outputStream.pipe(output);
    const appSettings = state.contentSelection.appSettings
      ? await this.settingsService.getSettings()
      : undefined;
    const mainWindowState = state.contentSelection.mainWindowState
      ? readMainWindowState(this.mainWindowStateFilePath)
      : undefined;

    createBackupArchiveEntries({
      appSettings,
      contentSelection: state.contentSelection,
      createdAt,
      mainWindowState,
      notes,
      source: BackupSource.DESKTOP
    }).forEach((entry) => this.addJson(zip, entry.fileName, entry.value));

    zip.end();
    await completion;
    await fs.promises.rename(temporaryArchivePath, archivePath);
  }

  private addJson(zip: yazl.ZipFile, fileName: string, value: unknown): void {
    zip.addBuffer(Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf-8"), fileName, { compress: true });
  }

}
