/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { createBackupState, recordBackupCreated, updateBackupContentSelection } from "../../../src/backup/backupState";

describe("backupState", () => {
  it("creates independent backup content selection state", () => {
    const selection = { appSettings: true, mainWindowState: true };

    const state = createBackupState("2026-11-07T12:00:00.000Z", selection);
    selection.appSettings = false;

    expect(state).toEqual({
      version: 1,
      initializedAt: "2026-11-07T12:00:00.000Z",
      contentSelection: { appSettings: true, mainWindowState: true }
    });
  });

  it("records backup creation without changing the configured content", () => {
    const state = createBackupState("2026-11-07T12:00:00.000Z", { appSettings: false, mainWindowState: true });

    expect(recordBackupCreated(state, "2026-11-07T12:30:00.000Z")).toEqual({
      ...state,
      lastBackupCreatedAt: "2026-11-07T12:30:00.000Z"
    });
  });

  it("updates backup content without losing its initialization or history", () => {
    const state = recordBackupCreated(
      createBackupState("2026-11-07T12:00:00.000Z", { appSettings: true, mainWindowState: true }),
      "2026-11-07T12:30:00.000Z"
    );

    expect(updateBackupContentSelection(state, { appSettings: false, mainWindowState: false })).toEqual({
      ...state,
      contentSelection: { appSettings: false, mainWindowState: false }
    });
  });
});
