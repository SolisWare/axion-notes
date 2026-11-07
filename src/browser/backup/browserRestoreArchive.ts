/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { unzipSync } from "fflate";
import { BackupArchiveFile, parseBackupArchive, ValidatedBackupArchive } from "../../backup/restoreArchive";

export function readBrowserRestoreArchive(bytes: Uint8Array): ValidatedBackupArchive {
  const files = unzipSync(bytes);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const entries: BackupArchiveFile[] = Object.entries(files).map(([fileName, content]) => ({
    fileName,
    content: decoder.decode(content)
  }));

  return parseBackupArchive(entries);
}
