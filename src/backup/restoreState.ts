/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { RestoreState } from "../types/RestoreState";
import { isValidTimestamp } from "./backupValidation";

export const RESTORE_STATE_VERSION = 1;

/**
 * Parses and validates persisted restore history.
 */
export function parseRestoreState(content: string): RestoreState {
  let state: unknown;

  try {
    state = JSON.parse(content);
  } catch {
    throw new Error("Restore state is not valid JSON.");
  }

  assertRestoreState(state);
  return state;
}

/**
 * Ensures that a value is supported persisted restore history.
 */
export function assertRestoreState(state: unknown): asserts state is RestoreState {
  if (!isRestoreState(state)) {
    throw new Error("Restore state has an unsupported format.");
  }
}

function isRestoreState(state: unknown): state is RestoreState {
  if (!isRecord(state)) {
    return false;
  }

  return state.version === RESTORE_STATE_VERSION
    && isValidTimestamp(state.lastRestoredAt);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

