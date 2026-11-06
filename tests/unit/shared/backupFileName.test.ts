/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { getDefaultBackupFileName } from "../../../src/backup/backupFileName";
import { DateFormat } from "../../../src/utils/dt-formatter/DateFormat";
import { TimeFormat } from "../../../src/utils/dt-formatter/TimeFormat";

describe("backupFileName", () => {
  it("creates a readable filename that is valid on macOS and Windows", () => {
    expect(getDefaultBackupFileName(
      new Date(2026, 10, 6, 15, 4, 5),
      DateFormat.MonthDayYearSlash,
      TimeFormat.Regular
    )).toBe("axion-notes-backup-11-6-2026_3-04-05-PM.zip");
  });
});
