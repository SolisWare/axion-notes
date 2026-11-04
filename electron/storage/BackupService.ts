/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { defaultBackupContentSelection } from "../../src/settings/defaultBackupContentSelection";
import { BackupState } from "../../src/types/BackupState";
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
   * Initializes managed backups with the default optional content selection.
   * Repeating setup preserves the existing configuration and backup history.
   */
  public async initialize(): Promise<BackupState> {
    const existingState = await this.getState();

    if (existingState) {
      return existingState;
    }

    const state: BackupState = {
      version: 1,
      initializedAt: this.getCurrentDate().toISOString(),
      contentSelection: { ...defaultBackupContentSelection }
    };

    await this.backupStateStorage.setState(state);
    return state;
  }
}
