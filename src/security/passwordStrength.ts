/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import { adjacencyGraphs, dictionary as commonDictionary } from "@zxcvbn-ts/language-common";
import { dictionary as englishDictionary, translations } from "@zxcvbn-ts/language-en";
import { PasswordCrackTimeEstimate } from "./PasswordCrackTimeEstimate";
import { PasswordStrengthLevel } from "./PasswordStrengthLevel";
import { PasswordStrengthResult } from "./PasswordStrengthResult";

const zxcvbn = new ZxcvbnFactory({
  dictionary: {
    ...commonDictionary,
    ...englishDictionary
  },
  graphs: adjacencyGraphs,
  translations
});

export function estimatePasswordStrength(password: string): PasswordStrengthResult {
  const result = zxcvbn.check(password);

  return {
    level: getPasswordStrengthLevel(result.score),
    score: result.score,
    estimatedCrackTime: getPasswordCrackTimeEstimate(result.crackTimes.offlineSlowHashingXPerSecond.seconds),
    warning: result.feedback.warning ?? undefined,
    suggestions: result.feedback.suggestions
  };
}

function getPasswordStrengthLevel(score: number): PasswordStrengthLevel {
  switch (score) {
    case 0:
      return PasswordStrengthLevel.VERY_WEAK;
    case 1:
      return PasswordStrengthLevel.WEAK;
    case 2:
      return PasswordStrengthLevel.MODERATE;
    case 3:
      return PasswordStrengthLevel.STRONG;
    default:
      return PasswordStrengthLevel.VERY_STRONG;
  }
}

function getPasswordCrackTimeEstimate(seconds: number): PasswordCrackTimeEstimate {
  if (seconds < 1) {
    return PasswordCrackTimeEstimate.INSTANTLY;
  }

  if (seconds < 60) {
    return PasswordCrackTimeEstimate.SECONDS;
  }

  if (seconds < 60 * 60) {
    return PasswordCrackTimeEstimate.MINUTES;
  }

  if (seconds < 60 * 60 * 24) {
    return PasswordCrackTimeEstimate.HOURS;
  }

  if (seconds < 60 * 60 * 24 * 31) {
    return PasswordCrackTimeEstimate.DAYS;
  }

  if (seconds < 60 * 60 * 24 * 365) {
    return PasswordCrackTimeEstimate.MONTHS;
  }

  if (seconds < 60 * 60 * 24 * 365 * 10) {
    return PasswordCrackTimeEstimate.YEARS;
  }

  if (seconds < 60 * 60 * 24 * 365 * 100) {
    return PasswordCrackTimeEstimate.DECADES;
  }

  if (seconds < 60 * 60 * 24 * 365 * 1000) {
    return PasswordCrackTimeEstimate.CENTURIES;
  }

  return PasswordCrackTimeEstimate.IMPRACTICAL;
}
