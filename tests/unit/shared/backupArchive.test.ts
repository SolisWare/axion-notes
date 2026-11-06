/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { createBackupArchiveEntries, getBackupPreferences } from "../../../src/backup/backupArchive";
import { defaultAppSettings } from "../../../src/settings/defaultSettings";

describe("backupArchive", () => {
  it("creates the core archive entries in their stable order", () => {
    const entries = createBackupArchiveEntries({
      contentSelection: {
        appSettings: false,
        mainWindowState: false
      },
      createdAt: "2026-11-06T10:30:00.000Z",
      notes: [{
        id: "note-1",
        bgcolor: "yellow",
        content: "Backup content",
        createdOn: new Date("2026-11-06T10:00:00.000Z"),
        lastModifiedOn: new Date("2026-11-06T10:15:00.000Z")
      }]
    });

    expect(entries).toEqual([
      {
        fileName: "manifest.json",
        value: {
          version: 1,
          createdAt: "2026-11-06T10:30:00.000Z",
          contentSelection: {
            appSettings: false,
            mainWindowState: false
          }
        }
      },
      {
        fileName: "notes.json",
        value: expect.arrayContaining([expect.objectContaining({ id: "note-1" })])
      },
      {
        fileName: "note-order.json",
        value: ["note-1"]
      }
    ]);
  });

  it("adds selected optional entries and removes security settings from plaintext preferences", () => {
    const settings = {
      ...defaultAppSettings,
      bruteForceProtectionEnabled: true,
      lockScreenContentProtectionEnabled: true,
      lockScreenEnabled: true,
      lockScreenIdleTimeout: 60,
      lockScreenOnSystemSleepEnabled: true,
      lockScreenRequirePasswordDelay: 30,
      notesEncryptionEnabled: true
    };
    const entries = createBackupArchiveEntries({
      appSettings: settings,
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      },
      createdAt: "2026-11-06T10:30:00.000Z",
      mainWindowState: {
        bounds: { height: 500, width: 700, x: 10, y: 20 },
        isMaximized: true
      },
      notes: []
    });

    expect(entries.map((entry) => entry.fileName)).toEqual([
      "manifest.json",
      "notes.json",
      "note-order.json",
      "app-preferences.json",
      "main-window-state.json"
    ]);
    expect(entries.find((entry) => entry.fileName === "app-preferences.json")?.value).toEqual(getBackupPreferences(settings));
    expect(getBackupPreferences(settings)).not.toHaveProperty("bruteForceProtectionEnabled");
    expect(getBackupPreferences(settings)).not.toHaveProperty("lockScreenContentProtectionEnabled");
    expect(getBackupPreferences(settings)).not.toHaveProperty("lockScreenEnabled");
    expect(getBackupPreferences(settings)).not.toHaveProperty("lockScreenIdleTimeout");
    expect(getBackupPreferences(settings)).not.toHaveProperty("lockScreenOnSystemSleepEnabled");
    expect(getBackupPreferences(settings)).not.toHaveProperty("lockScreenRequirePasswordDelay");
    expect(getBackupPreferences(settings)).not.toHaveProperty("notesEncryptionEnabled");
  });

  it("does not add optional entries when their content is unavailable", () => {
    const entries = createBackupArchiveEntries({
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      },
      createdAt: "2026-11-06T10:30:00.000Z",
      notes: []
    });

    expect(entries.map((entry) => entry.fileName)).toEqual([
      "manifest.json",
      "notes.json",
      "note-order.json"
    ]);
  });
});
