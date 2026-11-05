/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { DateFormat } from "../../../src/utils/dt-formatter/DateFormat";
import { Formatter } from "../../../src/utils/dt-formatter/Formatter";
import { TimeFormat } from "../../../src/utils/dt-formatter/TimeFormat";

describe("Formatter", () => {
  it("formats timestamps with seconds when requested", () => {
    expect(Formatter.getFormattedTimestamp(new Date(2026, 10, 5, 14, 13, 9), TimeFormat.Regular, true)).toBe("2:13:09 PM");
    expect(Formatter.getFormattedTimestamp(new Date(2026, 10, 5, 14, 13, 9), TimeFormat.Military, true)).toBe("14:13:09");
  });

  it("formats filename timestamps using the configured date and time formats", () => {
    expect(Formatter.getFormattedFileNameTimestamp(
      new Date(2026, 10, 5, 14, 13, 9),
      DateFormat.DayMonthYearDash,
      TimeFormat.Military
    )).toBe("05-11-2026_14-13-09");
  });
});
