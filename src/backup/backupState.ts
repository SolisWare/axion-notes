/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BackupState } from "../types/BackupState";
import { isValidTimestamp } from "./backupValidation";

export const BACKUP_STATE_VERSION = 1;

/**
 * Parses and validates a serialized backup configuration.
 */
export function parseBackupState(content: string): BackupState {
  let state: unknown;

  try {
    state = JSON.parse(content);
  } catch {
    throw new Error("Backup state is not valid JSON.");
  }

  assertBackupState(state);
  return state;
}

/**
 * Ensures that a value is a supported backup configuration.
 */
export function assertBackupState(state: unknown): asserts state is BackupState {
  if (!isBackupState(state)) {
    throw new Error("Backup state has an unsupported format.");
  }
}

function isBackupState(state: unknown): state is BackupState {
  if (!state || typeof state !== "object") {
    return false;
  }

  const candidate = state as Partial<BackupState>;
  const selection = candidate.contentSelection;

  return candidate.version === BACKUP_STATE_VERSION
    && isValidTimestamp(candidate.initializedAt)
    && typeof selection === "object"
    && selection !== null
    && typeof selection.appSettings === "boolean"
    && typeof selection.mainWindowState === "boolean"
    && (candidate.lastBackupCreatedAt === undefined || isValidTimestamp(candidate.lastBackupCreatedAt));
}

