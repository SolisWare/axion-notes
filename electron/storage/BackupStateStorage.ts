/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { assertBackupState, parseBackupState } from "../../src/backup/backupState";
import { BackupState } from "../../src/types/BackupState";
import { JsonStateStorage } from "./JsonStateStorage";

export const BACKUP_STATE_FILE_NAME = "backup-state.json";

/**
 * Persists the configuration and lifecycle information for the managed backup
 * archive. The archive itself is deliberately stored separately from this
 * state file.
 */
export class BackupStateStorage {
  private readonly storage: JsonStateStorage<BackupState>;

  public constructor(backupDirectory: string) {
    this.storage = new JsonStateStorage(
      backupDirectory,
      BACKUP_STATE_FILE_NAME,
      parseBackupState,
      assertBackupState,
      (state) => JSON.stringify(state, null, 2)
    );
  }

  /**
   * Reads the configured backup state when backups have been initialized.
   */
  public async getState(): Promise<BackupState | undefined> {
    return this.storage.getState();
  }

  /**
   * Writes backup state atomically so an interrupted update cannot leave a
   * partially written configuration file behind.
   */
  public async setState(state: BackupState): Promise<void> {
    return this.storage.setState(state);
  }

  public getStateFilePath(): string {
    return this.storage.getStateFilePath();
  }
}
