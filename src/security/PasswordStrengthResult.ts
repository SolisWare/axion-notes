/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { PasswordCrackTimeEstimate } from "./PasswordCrackTimeEstimate";
import { PasswordStrengthLevel } from "./PasswordStrengthLevel";

export type PasswordStrengthResult = {
  level: PasswordStrengthLevel;
  /**
   * Normalized strength score from 0 to 4.
   */
  score: number;
  estimatedCrackTime: PasswordCrackTimeEstimate;
  warning?: string;
  suggestions: string[];
};
