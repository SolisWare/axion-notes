/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";
import { PasswordCrackTimeEstimate } from "../../../src/security/PasswordCrackTimeEstimate";
import { PasswordStrengthLevel } from "../../../src/security/PasswordStrengthLevel";

const { checkPassword } = vi.hoisted(() => ({ checkPassword: vi.fn() }));

vi.mock("@zxcvbn-ts/core", () => ({
  ZxcvbnFactory: class {
    check = checkPassword;
  }
}));

import { estimatePasswordStrength } from "../../../src/security/passwordStrength";

describe("estimatePasswordStrength", () => {
  it.each([
    [0, PasswordStrengthLevel.VERY_WEAK],
    [1, PasswordStrengthLevel.WEAK],
    [2, PasswordStrengthLevel.MODERATE],
    [3, PasswordStrengthLevel.STRONG],
    [4, PasswordStrengthLevel.VERY_STRONG],
    [5, PasswordStrengthLevel.VERY_STRONG]
  ])("maps zxcvbn score %i to %s", (score, level) => {
    checkPassword.mockReturnValue(createZxcvbnResult({ score }));

    expect(estimatePasswordStrength("test-password")).toMatchObject({ score, level });
    expect(checkPassword).toHaveBeenCalledWith("test-password");
  });

  it.each([
    [0, PasswordCrackTimeEstimate.INSTANTLY],
    [0.999, PasswordCrackTimeEstimate.INSTANTLY],
    [1, PasswordCrackTimeEstimate.SECONDS],
    [59.999, PasswordCrackTimeEstimate.SECONDS],
    [60, PasswordCrackTimeEstimate.MINUTES],
    [60 * 60, PasswordCrackTimeEstimate.HOURS],
    [60 * 60 * 24, PasswordCrackTimeEstimate.DAYS],
    [60 * 60 * 24 * 31, PasswordCrackTimeEstimate.MONTHS],
    [60 * 60 * 24 * 365, PasswordCrackTimeEstimate.YEARS],
    [60 * 60 * 24 * 365 * 10, PasswordCrackTimeEstimate.DECADES],
    [60 * 60 * 24 * 365 * 100, PasswordCrackTimeEstimate.CENTURIES],
    [60 * 60 * 24 * 365 * 1000, PasswordCrackTimeEstimate.IMPRACTICAL]
  ])("maps %d offline hashing seconds to %s", (seconds, estimatedCrackTime) => {
    checkPassword.mockReturnValue(createZxcvbnResult({ seconds }));

    expect(estimatePasswordStrength("test-password").estimatedCrackTime).toBe(estimatedCrackTime);
  });

  it("preserves feedback returned by zxcvbn", () => {
    const suggestions = ["Use a longer password.", "Avoid common words."];
    checkPassword.mockReturnValue(createZxcvbnResult({
      warning: "This password is easy to guess.",
      suggestions
    }));

    expect(estimatePasswordStrength("password")).toEqual({
      level: PasswordStrengthLevel.MODERATE,
      score: 2,
      estimatedCrackTime: PasswordCrackTimeEstimate.MINUTES,
      warning: "This password is easy to guess.",
      suggestions
    });
  });

  it("normalizes an absent warning to undefined", () => {
    checkPassword.mockReturnValue(createZxcvbnResult({ warning: undefined }));

    expect(estimatePasswordStrength("test-password").warning).toBeUndefined();
  });
});

function createZxcvbnResult({
  score = 2,
  seconds = 60,
  warning,
  suggestions = [] as string[]
}: {
  score?: number;
  seconds?: number;
  warning?: string;
  suggestions?: string[];
} = {}) {
  return {
    score,
    crackTimes: {
      offlineSlowHashingXPerSecond: {
        seconds
      }
    },
    feedback: {
      warning,
      suggestions
    }
  };
}
