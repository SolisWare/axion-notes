/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { DateFormat } from "./DateFormat";

const DEFAULT_DATE_FORMAT = DateFormat.MonthDayYearSlash;
const SAMPLE_DATE = new Date(2026, 10, 22);

type DatePartType = "month" | "day" | "year";

/**
 * Returns the highest-priority date format resolved from a preferred locale list.
 */
export function resolvePreferredDateFormat(locales: readonly string[]): DateFormat {
  for (const locale of locales) {
    const dateFormat = resolveLocaleDateFormat(locale);

    if (dateFormat) {
      return dateFormat;
    }
  }

  return DEFAULT_DATE_FORMAT;
}

function resolveLocaleDateFormat(locale: string): DateFormat | undefined {
  try {
    const parts = new Intl.DateTimeFormat(locale).formatToParts(SAMPLE_DATE);
    const datePartOrder = parts
      .filter((part): part is Intl.DateTimeFormatPart & { type: DatePartType } => (
        part.type === "month" || part.type === "day" || part.type === "year"
      ))
      .map((part) => part.type);
    const separator = parts.find((part) => part.type === "literal" && /[./-]/.test(part.value))?.value.trim()[0];
    const isShortYear = parts.some((part) => part.type === "year" && part.value.length === 2);

    if (datePartOrder.length !== 3) {
      return undefined;
    }

    return getDateFormatForDatePartOrder(datePartOrder, separator, isShortYear);
  } catch {
    return undefined;
  }
}

function getDateFormatForDatePartOrder(
  datePartOrder: DatePartType[],
  separator: string | undefined,
  isShortYear: boolean
): DateFormat | undefined {
  const datePartOrderKey = datePartOrder.join("-");

  switch (datePartOrderKey) {
    case "month-day-year":
      return isShortYear
        ? DateFormat.MonthDayYearShortSlash
        : DateFormat.MonthDayYearSlash;
    case "day-month-year":
      if (isShortYear) {
        return DateFormat.DayMonthYearShortSlash;
      }

      if (separator === ".") {
        return DateFormat.DayMonthYearDot;
      }

      if (separator === "-") {
        return DateFormat.DayMonthYearDash;
      }

      return DateFormat.DayMonthYearSlash;
    case "year-month-day":
      if (separator === ".") {
        return DateFormat.YearMonthDayDot;
      }

      if (separator === "/") {
        return DateFormat.YearMonthDaySlash;
      }

      return DateFormat.YearMonthDayDash;
    default:
      return undefined;
  }
}
