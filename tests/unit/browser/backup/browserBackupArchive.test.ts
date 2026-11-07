/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { createBrowserBackupArchive } from "../../../../src/browser/backup/browserBackupArchive";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { BackupSource } from "../../../../src/types/BackupSource";

describe("browserBackupArchive", () => {
  it("creates a ZIP using the shared backup archive contract", async () => {
    const archive = await createBrowserBackupArchive({
      appSettings: defaultAppSettings,
      contentSelection: {
        appSettings: true,
        mainWindowState: false
      },
      createdAt: "2026-11-06T10:30:00.000Z",
      source: BackupSource.WEB,
      notes: [{
        id: "note-1",
        bgcolor: "yellow",
        content: "Browser backup content",
        createdOn: new Date("2026-11-06T10:00:00.000Z"),
        lastModifiedOn: new Date("2026-11-06T10:15:00.000Z")
      }]
    });
    const files = unzipSync(archive);

    expect(Object.keys(files)).toEqual([
      "manifest.json",
      "notes.json",
      "note-order.json",
      "app-preferences.json"
    ]);
    expect(JSON.parse(strFromU8(files["manifest.json"]))).toEqual({
      version: 1,
      createdAt: "2026-11-06T10:30:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: false
      },
      source: BackupSource.WEB
    });
    expect(JSON.parse(strFromU8(files["notes.json"]))).toEqual([{
      id: "note-1",
      bgcolor: "yellow",
      content: "Browser backup content",
      createdOn: "2026-11-06T10:00:00.000Z",
      lastModifiedOn: "2026-11-06T10:15:00.000Z"
    }]);
    expect(JSON.parse(strFromU8(files["note-order.json"]))).toEqual(["note-1"]);
  });

  it("omits unavailable optional data", async () => {
    const archive = await createBrowserBackupArchive({
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      },
      createdAt: "2026-11-06T10:30:00.000Z",
      notes: []
    });

    expect(Object.keys(unzipSync(archive))).toEqual([
      "manifest.json",
      "notes.json",
      "note-order.json"
    ]);
  });
});
