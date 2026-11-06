/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { strToU8, zip } from "fflate";
import { BackupArchiveContent, createBackupArchiveEntries } from "../../backup/backupArchive";

/**
 * Compresses shared Axion Notes backup entries into a browser-compatible ZIP archive.
 */
export function createBrowserBackupArchive(content: BackupArchiveContent): Promise<Uint8Array> {
  const files = Object.fromEntries(createBackupArchiveEntries(content).map((entry) => [
    entry.fileName,
    strToU8(`${JSON.stringify(entry.value, null, 2)}\n`)
  ]));

  return new Promise((resolve, reject) => {
    zip(files, { level: 6 }, (error, archive) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(archive);
    });
  });
}
