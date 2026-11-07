/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { assertRestoreState, parseRestoreState } from "../../src/backup/restoreState";
import { RestoreState } from "../../src/types/RestoreState";
import { JsonStateStorage } from "./JsonStateStorage";

export const RESTORE_STATE_FILE_NAME = "restore-state.json";

/**
 * Persists the latest successful restore independently from backup configuration.
 */
export class RestoreStateStorage {
  private readonly storage: JsonStateStorage<RestoreState>;

  public constructor(backupDirectory: string) {
    this.storage = new JsonStateStorage(backupDirectory, RESTORE_STATE_FILE_NAME, parseRestoreState, assertRestoreState);
  }

  /**
   * Returns the latest completed restore when one has been recorded.
   */
  public async getState(): Promise<RestoreState | undefined> {
    return this.storage.getState();
  }

  /**
   * Records a completed restore atomically.
   */
  public async setState(state: RestoreState): Promise<void> {
    return this.storage.setState(state);
  }

}
