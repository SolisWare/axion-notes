/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppSettings } from "../settings/AppSettings";
import { Formatter } from "../utils/dt-formatter/Formatter";
import { BACKUP_ARCHIVE_FILE_NAME } from "./backupArchive";

/**
 * Returns a readable, platform-safe filename for an exported backup archive.
 */
export function getDefaultBackupFileName(
  date: Date,
  dateFormat?: AppSettings["dateFormat"],
  timeFormat?: AppSettings["timeFormat"]
): string {
  const timestamp = Formatter.getFormattedFileNameTimestamp(date, dateFormat, timeFormat);

  return BACKUP_ARCHIVE_FILE_NAME.replace(".zip", `-${timestamp}.zip`);
}
