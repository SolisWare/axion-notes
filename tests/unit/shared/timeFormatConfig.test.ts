/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimeFormat } from "../../../src/utils/dt-formatter/TimeFormat";
import { resolvePreferredTimeFormat } from "../../../src/utils/dt-formatter/timeFormatConfig";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolvePreferredTimeFormat", () => {
  it("recognizes locales with a day period as 12-hour time", () => {
    mockTimeFormat({
      regular: [{ type: "dayPeriod", value: "PM" }]
    });

    expect(resolvePreferredTimeFormat(["regular"])).toBe(TimeFormat.Regular);
  });

  it("recognizes locales without a day period as 24-hour time", () => {
    mockTimeFormat({
      military: [{ type: "hour", value: "16" }]
    });

    expect(resolvePreferredTimeFormat(["military"])).toBe(TimeFormat.Military);
  });

  it("uses the next locale after an invalid one and defaults when none resolve", () => {
    mockTimeFormat({
      military: [{ type: "hour", value: "16" }]
    });

    expect(resolvePreferredTimeFormat(["invalid", "military"])).toBe(TimeFormat.Military);
    expect(resolvePreferredTimeFormat(["invalid"])).toBe(TimeFormat.Regular);
    expect(resolvePreferredTimeFormat([])).toBe(TimeFormat.Regular);
  });
});

function mockTimeFormat(partsByLocale: Record<string, Intl.DateTimeFormatPart[]>): void {
  const DateTimeFormatMock = function(this: unknown, locale: string): Intl.DateTimeFormat {
    if (locale === "invalid") {
      throw new RangeError("Invalid locale");
    }

    return {
      formatToParts: () => partsByLocale[locale] ?? []
    } as Intl.DateTimeFormat;
  };

  vi.spyOn(Intl, "DateTimeFormat").mockImplementation(DateTimeFormatMock as typeof Intl.DateTimeFormat);
}
