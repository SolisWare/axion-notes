/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { assertRestoreState, parseRestoreState, RESTORE_STATE_VERSION } from "../../../src/backup/restoreState";

describe("restoreState", () => {
  it("parses valid restore history", () => {
    expect(parseRestoreState(JSON.stringify({
      lastRestoredAt: "2026-11-07T12:00:00.000Z",
      version: RESTORE_STATE_VERSION
    }))).toEqual({
      lastRestoredAt: "2026-11-07T12:00:00.000Z",
      version: 1
    });
  });

  it("rejects malformed restore history", () => {
    expect(() => parseRestoreState("not-json")).toThrow("Restore state is not valid JSON.");
    expect(() => assertRestoreState({ version: 1, lastRestoredAt: "not-a-date" })).toThrow("Restore state has an unsupported format.");
    expect(() => assertRestoreState({ version: 2, lastRestoredAt: "2026-11-07T12:00:00.000Z" })).toThrow("Restore state has an unsupported format.");
  });
});
