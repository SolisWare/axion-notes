/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import yazl from "yazl";
import { afterEach, describe, expect, it } from "vitest";
import { BackupArchiveReader, MAX_BACKUP_ARCHIVE_ENTRIES } from "../../../../electron/storage/BackupArchiveReader";
import { createBackupArchiveEntries } from "../../../../src/backup/backupArchive";

const directories: string[] = [];

describe("BackupArchiveReader", () => {
  afterEach(async () => {
    await Promise.all(directories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
  });

  it("reads a valid backup ZIP into a validated archive", async () => {
    const archivePath = await writeZip(createBackupArchiveEntries({
      contentSelection: { appSettings: false, mainWindowState: false },
      createdAt: "2026-11-07T12:00:00.000Z",
      notes: [{
        bgcolor: "yellow",
        content: "Restored note",
        createdOn: new Date("2026-11-07T10:00:00.000Z"),
        id: "note-1",
        lastModifiedOn: new Date("2026-11-07T11:00:00.000Z")
      }]
    }));

    await expect(new BackupArchiveReader().readArchive(archivePath)).resolves.toMatchObject({
      noteOrder: ["note-1"],
      notes: [{ content: "Restored note", id: "note-1" }]
    });
  });

  it("rejects archives with unsupported entries", async () => {
    const archivePath = await writeZip([
      { fileName: "manifest.json", value: { contentSelection: { appSettings: false, mainWindowState: false }, createdAt: "2026-11-07T12:00:00.000Z", version: 1 } },
      { fileName: "notes.json", value: [] },
      { fileName: "note-order.json", value: [] },
      { fileName: "unexpected.json", value: {} }
    ]);

    await expect(new BackupArchiveReader().readArchive(archivePath)).rejects.toThrow("unsupported file: unexpected.json");
  });

  it("rejects archives with more entries than the backup format permits", async () => {
    const archivePath = await writeZip(Array.from({ length: MAX_BACKUP_ARCHIVE_ENTRIES + 1 }, (_, index) => ({
      fileName: `file-${index}.json`,
      value: {}
    })));

    await expect(new BackupArchiveReader().readArchive(archivePath)).rejects.toThrow("contains too many files");
  });
});

async function writeZip(entries: Array<{ fileName: string; value: unknown }>): Promise<string> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-backup-reader-"));
  const archivePath = path.join(directory, "backup.zip");
  const zip = new yazl.ZipFile();
  const output = fs.createWriteStream(archivePath);
  const completion = new Promise<void>((resolve, reject) => {
    output.once("close", resolve);
    output.once("error", reject);
  });

  entries.forEach((entry) => zip.addBuffer(Buffer.from(JSON.stringify(entry.value), "utf-8"), entry.fileName));
  zip.outputStream.pipe(output);
  zip.end();
  await completion;

  directories.push(directory);
  return archivePath;
}
