/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { backupStateKey, getBackupState, setBackupState } from "../../../../src/browser/storage/backupStateStorage";
import { BackupState } from "../../../../src/types/BackupState";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("backupStateStorage", () => {
  it("returns undefined before browser backups have been initialized", () => {
    expect(getBackupState()).toBeUndefined();
  });

  it("persists and reads a valid backup configuration", () => {
    const state = createBackupState();

    setBackupState(state);

    expect(localStorage.getItem(backupStateKey)).toBe(JSON.stringify(state));
    expect(getBackupState()).toEqual(state);
  });

  it.each([
    ["malformed JSON", "{"],
    ["an unsupported version", JSON.stringify({ ...createBackupState(), version: 2 })],
    ["an invalid backup timestamp", JSON.stringify({ ...createBackupState(), lastBackupCreatedAt: "not-a-date" })]
  ])("ignores %s", (_name, state) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    localStorage.setItem(backupStateKey, state);

    expect(getBackupState()).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it("rejects attempts to persist an unsupported configuration", () => {
    expect(() => setBackupState({ ...createBackupState(), version: 2 } as BackupState)).toThrow("Backup state has an unsupported format.");
  });
});

function createBackupState(): BackupState {
  return {
    version: 1,
    initializedAt: "2026-11-06T10:00:00.000Z",
    contentSelection: {
      appSettings: true,
      mainWindowState: false
    },
    lastBackupCreatedAt: "2026-11-06T10:30:00.000Z"
  };
}
