/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearRestoreState, getRestoreState, restoreStateKey, setRestoreState } from "../../../../src/browser/storage/restoreStateStorage";
import { RestoreState } from "../../../../src/types/RestoreState";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("restoreStateStorage", () => {
  it("persists, reads, and clears successful restore history", () => {
    const state = createRestoreState();

    setRestoreState(state);

    expect(localStorage.getItem(restoreStateKey)).toBe(JSON.stringify(state));
    expect(getRestoreState()).toEqual(state);

    clearRestoreState();

    expect(getRestoreState()).toBeUndefined();
  });

  it.each([
    ["malformed JSON", "{"],
    ["an unsupported version", JSON.stringify({ ...createRestoreState(), version: 2 })],
    ["an invalid restore timestamp", JSON.stringify({ ...createRestoreState(), lastRestoredAt: "not-a-date" })]
  ])("ignores %s", (_name, state) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    localStorage.setItem(restoreStateKey, state);

    expect(getRestoreState()).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it("rejects attempts to persist unsupported restore history", () => {
    expect(() => setRestoreState({ ...createRestoreState(), version: 2 } as RestoreState)).toThrow("Restore state has an unsupported format.");
  });
});

function createRestoreState(): RestoreState {
  return {
    lastRestoredAt: "2026-11-07T12:30:00.000Z",
    version: 1
  };
}
