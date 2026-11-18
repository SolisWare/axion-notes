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

  it("formats midnight and noon correctly in 12-hour time", () => {
    expect(Formatter.getFormattedTimestamp(new Date(2026, 10, 5, 0, 5))).toBe("12:05 AM");
    expect(Formatter.getFormattedTimestamp(new Date(2026, 10, 5, 12, 5))).toBe("12:05 PM");
  });

  it("formats each supported date layout and converts optional dates", () => {
    const date = new Date(2026, 10, 5, 14, 13, 9);

    expect(Formatter.getFormattedDate(date, DateFormat.MonthDayYearShortSlash)).toBe("11/5/26");
    expect(Formatter.getFormattedDate(date, DateFormat.MonthDayYearSlash)).toBe("11/5/2026");
    expect(Formatter.getFormattedDate(date, DateFormat.DayMonthYearShortSlash)).toBe("5/11/26");
    expect(Formatter.getFormattedDate(date, DateFormat.DayMonthYearSlash)).toBe("5/11/2026");
    expect(Formatter.getFormattedDate(date, DateFormat.DayMonthYearDot)).toBe("05.11.2026");
    expect(Formatter.getFormattedDate(date, DateFormat.DayMonthYearDash)).toBe("05-11-2026");
    expect(Formatter.getFormattedDate(date, DateFormat.YearMonthDaySlash)).toBe("2026/11/5");
    expect(Formatter.getFormattedDate(date, DateFormat.YearMonthDayDot)).toBe("2026.11.05");
    expect(Formatter.getFormattedDate(date, DateFormat.YearMonthDayDash)).toBe("2026-11-05");
    expect(Formatter.toDate("2026-11-05T14:13:09.000Z")).toEqual(new Date("2026-11-05T14:13:09.000Z"));
    expect(Formatter.toOptionalDate(undefined)).toBeUndefined();
  });

  it("formats filename timestamps using the configured date and time formats", () => {
    expect(Formatter.getFormattedFileNameTimestamp(
      new Date(2026, 10, 5, 14, 13, 9),
      DateFormat.DayMonthYearDash,
      TimeFormat.Military
    )).toBe("05-11-2026_14-13-09");
  });
});
