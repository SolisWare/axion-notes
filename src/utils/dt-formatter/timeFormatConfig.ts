/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { TimeFormat } from "./TimeFormat";

const DEFAULT_TIME_FORMAT = TimeFormat.Regular;
const SAMPLE_TIME = new Date(2026, 10, 22, 16, 30);

/**
 * Returns the highest-priority time format resolved from a preferred locale list.
 */
export function resolvePreferredTimeFormat(locales: readonly string[]): TimeFormat {
  for (const locale of locales) {
    const timeFormat = resolveLocaleTimeFormat(locale);

    if (timeFormat) {
      return timeFormat;
    }
  }

  return DEFAULT_TIME_FORMAT;
}

function resolveLocaleTimeFormat(locale: string): TimeFormat | undefined {
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "numeric"
    }).formatToParts(SAMPLE_TIME);

    return parts.some((part) => part.type === "dayPeriod")
      ? TimeFormat.Regular
      : TimeFormat.Military;
  } catch {
    return undefined;
  }
}
