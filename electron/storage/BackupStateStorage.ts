/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { assertBackupState, parseBackupState } from "../../src/backup/backupState";
import { BackupState } from "../../src/types/BackupState";

export const BACKUP_STATE_FILE_NAME = "backup-state.json";

/**
 * Persists the configuration and lifecycle information for the managed backup
 * archive. The archive itself is deliberately stored separately from this
 * state file.
 */
export class BackupStateStorage {
  
  public constructor(private readonly backupDirectory: string) {
  }

  /**
   * Reads the configured backup state when backups have been initialized.
   */
  public async getState(): Promise<BackupState | undefined> {
    let content: string;

    try {
      content = await fs.promises.readFile(this.getStateFilePath(), "utf-8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }

      throw err;
    }

    return this.parseState(content);
  }

  /**
   * Writes backup state atomically so an interrupted update cannot leave a
   * partially written configuration file behind.
   */
  public async setState(state: BackupState): Promise<void> {
    assertBackupState(state);

    const stateFilePath = this.getStateFilePath();
    const temporaryFilePath = `${stateFilePath}.tmp`;

    await fs.promises.mkdir(this.backupDirectory, { recursive: true });
    await fs.promises.writeFile(temporaryFilePath, JSON.stringify(state, null, 2), "utf-8");
    await fs.promises.rename(temporaryFilePath, stateFilePath);
  }

  public getStateFilePath(): string {
    return path.join(this.backupDirectory, BACKUP_STATE_FILE_NAME);
  }

  private parseState(content: string): BackupState {
    return parseBackupState(content);
  }
}
