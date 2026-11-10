/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import * as yazl from "yazl";
import { strToU8, zipSync } from "fflate";
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

  it("rejects a valid ZIP when any notes entry is malformed", () => {
    const archive = zipSync({
      "manifest.json": strToU8(JSON.stringify({
        version: 1,
        createdAt: "2026-11-07T12:00:00.000Z",
        contentSelection: { appSettings: false, mainWindowState: false }
      })),
      "notes.json": strToU8(JSON.stringify([
        {
          bgcolor: "yellow",
          content: "Valid note",
          createdOn: "2026-11-07T10:00:00.000Z",
          id: "valid-note",
          lastModifiedOn: "2026-11-07T11:00:00.000Z"
        },
        { bgcolor: "yellow", content: "Malformed note", id: "invalid-note" }
      ])),
      "note-order.json": strToU8(JSON.stringify(["valid-note", "invalid-note"]))
    });

    expect(() => readBrowserRestoreArchive(archive)).toThrow("note with an unsupported format");
  });

  it("reads an archive written by the desktop ZIP writer", async () => {
    const archive = await createDesktopArchive({
      "main-window-state.json": {
        bounds: { height: 500, width: 700, x: 10, y: 20 },
        isMaximized: false
      },
      "manifest.json": {
        version: 1,
        createdAt: "2026-11-07T12:00:00.000Z",
        contentSelection: { appSettings: false, mainWindowState: true }
      },
      "note-order.json": ["desktop-note"],
      "notes.json": [{
        bgcolor: "yellow",
        content: "Desktop backup content",
        createdOn: "2026-11-07T10:00:00.000Z",
        id: "desktop-note",
        lastModifiedOn: "2026-11-07T11:00:00.000Z"
      }]
    });

    expect(readBrowserRestoreArchive(archive)).toMatchObject({
      mainWindowState: { bounds: { height: 500, width: 700, x: 10, y: 20 }, isMaximized: false },
      noteOrder: ["desktop-note"],
      notes: [{ id: "desktop-note", content: "Desktop backup content" }]
    });
  });
});

function createDesktopArchive(files: Record<string, unknown>): Promise<Uint8Array> {
  const zip = new yazl.ZipFile();

  Object.entries(files).forEach(([fileName, value]) => {
    zip.addBuffer(Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf-8"), fileName, { compress: true });
  });

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    zip.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    zip.outputStream.once("error", reject);
    zip.outputStream.once("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    zip.end();
  });
}
