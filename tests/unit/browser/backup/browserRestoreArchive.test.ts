/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { createBrowserBackupArchive } from "../../../../src/browser/backup/browserBackupArchive";
import { readBrowserRestoreArchive } from "../../../../src/browser/backup/browserRestoreArchive";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";

describe("browserRestoreArchive", () => {
  it("reads a ZIP created by the browser backup writer", async () => {
    const archive = await createBrowserBackupArchive({
      appSettings: defaultAppSettings,
      contentSelection: { appSettings: true, mainWindowState: false },
      createdAt: "2026-11-07T12:00:00.000Z",
      notes: [{
        bgcolor: "yellow",
        content: "Restored browser note",
        createdOn: new Date("2026-11-07T10:00:00.000Z"),
        id: "restored-note",
        lastModifiedOn: new Date("2026-11-07T11:00:00.000Z")
      }]
    });

    expect(readBrowserRestoreArchive(archive)).toMatchObject({
      createdAt: "2026-11-07T12:00:00.000Z",
      noteOrder: ["restored-note"],
      notes: [{ id: "restored-note", content: "Restored browser note" }]
    });
  });

  it("rejects bytes that are not a ZIP archive", () => {
    expect(() => readBrowserRestoreArchive(new Uint8Array([1, 2, 3]))).toThrow();
  });
});
