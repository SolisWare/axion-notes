/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { assertRestoreState, parseRestoreState } from "../../src/backup/restoreState";
import { RestoreState } from "../../src/types/RestoreState";

export const RESTORE_STATE_FILE_NAME = "restore-state.json";

/**
 * Persists the latest successful restore independently from backup configuration.
 */
export class RestoreStateStorage {

  public constructor(private readonly backupDirectory: string) {
  }

  /**
   * Returns the latest completed restore when one has been recorded.
   */
  public async getState(): Promise<RestoreState | undefined> {
    try {
      return parseRestoreState(await fs.promises.readFile(this.getStateFilePath(), "utf-8"));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }

      throw err;
    }
  }

  /**
   * Records a completed restore atomically.
   */
  public async setState(state: RestoreState): Promise<void> {
    assertRestoreState(state);
    await fs.promises.mkdir(this.backupDirectory, { recursive: true });

    const stateFilePath = this.getStateFilePath();
    const temporaryStateFilePath = `${stateFilePath}.tmp`;

    await fs.promises.writeFile(temporaryStateFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf-8");
    await fs.promises.rename(temporaryStateFilePath, stateFilePath);
  }

  private getStateFilePath(): string {
    return path.join(this.backupDirectory, RESTORE_STATE_FILE_NAME);
  }

}
