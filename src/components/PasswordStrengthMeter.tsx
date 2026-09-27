/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { PasswordCrackTimeEstimate } from "../security/PasswordCrackTimeEstimate";
import { PasswordStrengthLevel } from "../security/PasswordStrengthLevel";
import { estimatePasswordStrength } from "../security/passwordStrength";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./PasswordStrengthMeter.module.css";

type PasswordStrengthMeterCssProperties = CSSProperties & {
  "--password-strength-color": string;
  "--password-strength-muted-text": string;
  "--password-strength-track": string;
  "--password-strength-text": string;
};

type PasswordStrengthMeterProps = {
  password: string;
  theme: SystemTheme;
};

const PASSWORD_STRENGTH_COLORS: Record<PasswordStrengthLevel, string> = {
  [PasswordStrengthLevel.VERY_WEAK]: "#E60000",
  [PasswordStrengthLevel.WEAK]: "#D97706",
  [PasswordStrengthLevel.MODERATE]: "#C9A227",
  [PasswordStrengthLevel.STRONG]: "#138EC7",
  [PasswordStrengthLevel.VERY_STRONG]: "#00A362"
};

const EMPTY_PASSWORD_SCORE = -1;

function getPasswordStrengthLevelTranslationKey(level: PasswordStrengthLevel): string {
  switch (level) {
    case PasswordStrengthLevel.VERY_WEAK:
      return "veryWeak";
    case PasswordStrengthLevel.WEAK:
      return "weak";
    case PasswordStrengthLevel.MODERATE:
      return "moderate";
    case PasswordStrengthLevel.STRONG:
      return "strong";
    case PasswordStrengthLevel.VERY_STRONG:
      return "veryStrong";
  }
}

function getPasswordCrackTimeEstimateTranslationKey(estimate: PasswordCrackTimeEstimate): string {
  switch (estimate) {
    case PasswordCrackTimeEstimate.INSTANTLY:
      return "time.instantly";
    case PasswordCrackTimeEstimate.SECONDS:
      return "time.seconds";
    case PasswordCrackTimeEstimate.MINUTES:
      return "time.minutes";
    case PasswordCrackTimeEstimate.HOURS:
      return "time.hours";
    case PasswordCrackTimeEstimate.DAYS:
      return "time.days";
    case PasswordCrackTimeEstimate.MONTHS:
      return "time.months";
    case PasswordCrackTimeEstimate.YEARS:
      return "time.years";
    case PasswordCrackTimeEstimate.DECADES:
      return "time.decades";
    case PasswordCrackTimeEstimate.CENTURIES:
      return "time.centuries";
    case PasswordCrackTimeEstimate.IMPRACTICAL:
      return "time.impractical";
  }
}

function PasswordStrengthMeter(props: PasswordStrengthMeterProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const passwordStrength = props.password ? estimatePasswordStrength(props.password) : undefined;
  const meterStyle: PasswordStrengthMeterCssProperties = {
    "--password-strength-color": passwordStrength ? PASSWORD_STRENGTH_COLORS[passwordStrength.level] : appColors.SETTINGS_SECTION_TEXT,
    "--password-strength-muted-text": appColors.SETTINGS_SECTION_TEXT,
    "--password-strength-track": appColors.SETTINGS_DIVIDER,
    "--password-strength-text": appColors.SETTINGS_NAV_TEXT
  };
  const score = passwordStrength?.score ?? EMPTY_PASSWORD_SCORE;
  const hint = passwordStrength ? passwordStrength.warning ?? passwordStrength.suggestions[0] ?? "" : "";

  return (
    <div className={styles.passwordStrengthMeter} style={meterStyle}>
      <div className={styles.passwordStrengthHeader}>
        <span>{t("passwordStrength")}</span>
        {passwordStrength && (
          <span className={styles.passwordStrengthLevel}>{t(getPasswordStrengthLevelTranslationKey(passwordStrength.level))}</span>
        )}
      </div>
      <div className={styles.passwordStrengthTrack} aria-hidden="true">
        {Array.from({ length: 5 }).map((_segment, index) => (
          <span
            className={[
              styles.passwordStrengthSegment,
              index <= score ? styles.passwordStrengthSegmentActive : ""
            ].filter(Boolean).join(" ")}
            key={index}
          />
        ))}
      </div>
      {passwordStrength ? (
        <p className={styles.passwordStrengthEstimate}>
          {t("estimatedResistance", {
            estimate: t(getPasswordCrackTimeEstimateTranslationKey(passwordStrength.estimatedCrackTime))
          })}
        </p>
      ) : (
        <p className={styles.passwordStrengthEstimate}>{t("enterPasswordToEstimateStrength")}</p>
      )}
      <p className={styles.passwordStrengthHint}>{hint}</p>
    </div>
  );
}

export default PasswordStrengthMeter;
