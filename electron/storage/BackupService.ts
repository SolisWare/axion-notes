/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { defaultBackupContentSelection } from "../../src/settings/defaultBackupContentSelection";
import { BackupContentSelection } from "../../src/types/BackupContentSelection";
import { BackupState } from "../../src/types/BackupState";
import { createBackupState, updateBackupContentSelection } from "../../src/backup/backupState";
import { BackupStateStorage } from "./BackupStateStorage";

/**
 * Coordinates the managed backup configuration for the Electron main process.
 */
export class BackupService {
  
  public constructor(private readonly backupStateStorage: BackupStateStorage,
                     private readonly getCurrentDate: () => Date = () => new Date()) {
  }

  /**
   * Returns the configured backup state, if backups have been initialized.
   */
  public async getState(): Promise<BackupState | undefined> {
    return this.backupStateStorage.getState();
  }

  /**
   * Initializes managed backups with the selected optional content.
   * Repeating setup preserves the existing configuration and backup history.
   */
  public async initialize(contentSelection: BackupContentSelection = defaultBackupContentSelection): Promise<BackupState> {
    const existingState = await this.getState();

    if (existingState) {
      return existingState;
    }

    const state = createBackupState(this.getCurrentDate().toISOString(), contentSelection);

    await this.backupStateStorage.setState(state);
    return state;
  }

  /**
   * Replaces the optional content selection while preserving backup history.
   */
  public async updateContentSelection(contentSelection: BackupContentSelection): Promise<BackupState> {
    const state = await this.getState();

    if (!state) {
      throw new Error("Backups have not been initialized.");
    }

    const updatedState = updateBackupContentSelection(state, contentSelection);
    await this.backupStateStorage.setState(updatedState);

    return updatedState;
  }
}
