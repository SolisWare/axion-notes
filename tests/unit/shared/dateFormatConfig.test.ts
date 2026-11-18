/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateFormat } from "../../../src/utils/dt-formatter/DateFormat";
import { resolvePreferredDateFormat } from "../../../src/utils/dt-formatter/dateFormatConfig";

type DatePart = Intl.DateTimeFormatPart;

const dateFormatParts: Record<string, DatePart[]> = {
  "day-dot": parts("day", ".", "month", ".", "year"),
  "day-dash": parts("day", "-", "month", "-", "year"),
  "day-short": parts("day", "/", "month", "/", "year", "26"),
  "day-slash": parts("day", "/", "month", "/", "year"),
  "month-short": parts("month", "/", "day", "/", "year", "26"),
  "month-slash": parts("month", "/", "day", "/", "year"),
  "unsupported-order": parts("month", "/", "year", "/", "day"),
  "year-dash": parts("year", "-", "month", "-", "day"),
  "year-dot": parts("year", ".", "month", ".", "day"),
  "year-slash": parts("year", "/", "month", "/", "day")
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolvePreferredDateFormat", () => {
  it.each([
    ["month-short", DateFormat.MonthDayYearShortSlash],
    ["month-slash", DateFormat.MonthDayYearSlash],
    ["day-short", DateFormat.DayMonthYearShortSlash],
    ["day-slash", DateFormat.DayMonthYearSlash],
    ["day-dot", DateFormat.DayMonthYearDot],
    ["day-dash", DateFormat.DayMonthYearDash],
    ["year-slash", DateFormat.YearMonthDaySlash],
    ["year-dot", DateFormat.YearMonthDayDot],
    ["year-dash", DateFormat.YearMonthDayDash]
  ])("resolves %s", (locale, expectedFormat) => {
    mockDateTimeFormat();

    expect(resolvePreferredDateFormat([locale])).toBe(expectedFormat);
  });

  it("uses the next supported locale after an invalid one and defaults when none resolve", () => {
    mockDateTimeFormat();

    expect(resolvePreferredDateFormat(["invalid", "day-dot"])).toBe(DateFormat.DayMonthYearDot);
    expect(resolvePreferredDateFormat(["invalid", "incomplete"])).toBe(DateFormat.MonthDayYearSlash);
    expect(resolvePreferredDateFormat(["unsupported-order"])).toBe(DateFormat.MonthDayYearSlash);
    expect(resolvePreferredDateFormat([])).toBe(DateFormat.MonthDayYearSlash);
  });
});

function mockDateTimeFormat(): void {
  const DateTimeFormatMock = function(this: unknown, locale: string): Intl.DateTimeFormat {
    if (locale === "invalid") {
      throw new RangeError("Invalid locale");
    }

    return {
      formatToParts: () => dateFormatParts[locale] ?? [
        { type: "month", value: "11" },
        { type: "literal", value: "/" },
        { type: "year", value: "2026" }
      ]
    } as Intl.DateTimeFormat;
  };

  vi.spyOn(Intl, "DateTimeFormat").mockImplementation(DateTimeFormatMock as typeof Intl.DateTimeFormat);
}

function parts(first: "month" | "day" | "year", firstSeparator: string, second: "month" | "day" | "year", secondSeparator: string, third: "month" | "day" | "year", year = "2026"): DatePart[] {
  const valueFor = (part: "month" | "day" | "year") => part === "year" ? year : "11";

  return [
    { type: first, value: valueFor(first) },
    { type: "literal", value: firstSeparator },
    { type: second, value: valueFor(second) },
    { type: "literal", value: secondSeparator },
    { type: third, value: valueFor(third) }
  ];
}
