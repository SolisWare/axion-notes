/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { assertBackupState, parseBackupState } from "../../backup/backupState";
import { BackupState } from "../../types/BackupState";

export const backupStateKey = "solisware.axion-notes.backup-state";

/**
 * Returns the browser backup configuration when backups have been initialized.
 */
export function getBackupState(): BackupState | undefined {
  const serializedState = localStorage.getItem(backupStateKey);

  if (!serializedState) {
    return undefined;
  }

  try {
    return parseBackupState(serializedState);
  } catch (err) {
    console.warn("Failed to load browser backup state:", err);
    return undefined;
  }
}

/**
 * Persists the browser backup configuration in Axion Notes local storage.
 */
export function setBackupState(state: BackupState): void {
  assertBackupState(state);
  localStorage.setItem(backupStateKey, JSON.stringify(state));
}
