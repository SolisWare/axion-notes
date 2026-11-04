/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { BackupState } from "../../src/types/BackupState";

export const BACKUP_STATE_FILE_NAME = "backup-state.json";

const BACKUP_STATE_VERSION = 1;

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
    this.validateState(state);

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
    let state: unknown;

    try {
      state = JSON.parse(content);
    } catch {
      throw new Error("Backup state is not valid JSON.");
    }

    this.validateState(state);
    return state;
  }

  private validateState(state: unknown): asserts state is BackupState {
    if (!this.isBackupState(state)) {
      throw new Error("Backup state has an unsupported format.");
    }
  }

  private isBackupState(state: unknown): state is BackupState {
    if (!state || typeof state !== "object") {
      return false;
    }

    const candidate = state as Partial<BackupState>;
    const selection = candidate.contentSelection;

    return candidate.version === BACKUP_STATE_VERSION
      && this.isValidTimestamp(candidate.initializedAt)
      && typeof selection === "object"
      && selection !== null
      && typeof selection.appSettings === "boolean"
      && typeof selection.mainWindowState === "boolean"
      && (candidate.lastBackupCreatedAt === undefined || this.isValidTimestamp(candidate.lastBackupCreatedAt));
  }

  private isValidTimestamp(value: unknown): value is string {
    return typeof value === "string" && !Number.isNaN(Date.parse(value));
  }
}
