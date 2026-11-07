/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { assertRestoreState, parseRestoreState } from "../../backup/restoreState";
import { RestoreState } from "../../types/RestoreState";

export const restoreStateKey = "solisware.axion-notes.restore-state";

export function getRestoreState(): RestoreState | undefined {
  const serializedState = localStorage.getItem(restoreStateKey);

  if (!serializedState) {
    return undefined;
  }

  try {
    return parseRestoreState(serializedState);
  } catch (err) {
    console.warn("Failed to load browser restore state:", err);
    return undefined;
  }
}

export function setRestoreState(state: RestoreState): void {
  assertRestoreState(state);
  localStorage.setItem(restoreStateKey, JSON.stringify(state));
}

export function clearRestoreState(): void {
  localStorage.removeItem(restoreStateKey);
}
