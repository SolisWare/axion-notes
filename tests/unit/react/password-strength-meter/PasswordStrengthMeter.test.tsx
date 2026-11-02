/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PasswordStrengthMeter from "../../../../src/components/PasswordStrengthMeter";
import { PasswordCrackTimeEstimate } from "../../../../src/security/PasswordCrackTimeEstimate";
import { PasswordStrengthLevel } from "../../../../src/security/PasswordStrengthLevel";
import { getAppColors } from "../../../../src/theme/AppColors";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const { estimatePasswordStrength, translate } = vi.hoisted(() => ({
  estimatePasswordStrength: vi.fn(),
  translate: vi.fn((key: string, values?: Record<string, string>) => {
    if (key === "estimatedResistance") {
      return `Estimated resistance: ${values?.estimate}`;
    }

    return key;
  })
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

vi.mock("../../../../src/security/passwordStrength", () => ({
  estimatePasswordStrength
}));

describe("PasswordStrengthMeter", () => {
  beforeEach(() => {
    estimatePasswordStrength.mockReset();
    translate.mockClear();
  });

  describe("accessibility", () => {
    it("exposes the empty password guidance as a polite, atomic status", () => {
      renderPasswordStrengthMeter({ password: "" });

      const status = screen.getByRole("status");

      expect(status).toHaveAttribute("aria-live", "polite");
      expect(status).toHaveAttribute("aria-atomic", "true");
      expect(status).toHaveTextContent("passwordStrength");
      expect(status).toHaveTextContent("enterPasswordToEstimateStrength");
      expect(estimatePasswordStrength).not.toHaveBeenCalled();
    });

    it("announces the full strength result while keeping meter segments decorative", () => {
      mockPasswordStrength({
        level: PasswordStrengthLevel.STRONG,
        score: 3,
        estimatedCrackTime: PasswordCrackTimeEstimate.YEARS,
        suggestions: ["Use a longer password"]
      });

      renderPasswordStrengthMeter({ password: "correct horse battery staple" });

      const status = screen.getByRole("status");

      expect(status).toHaveTextContent("passwordStrength");
      expect(status).toHaveTextContent("strong");
      expect(status).toHaveTextContent("Estimated resistance: time.years");
      expect(status).toHaveTextContent("Use a longer password");
      expect(status.querySelector("[aria-hidden=\"true\"]")).toBeInTheDocument();
    });
  });

  describe("strength presentation", () => {
    it.each([
      [PasswordStrengthLevel.VERY_WEAK, 0, "veryWeak"],
      [PasswordStrengthLevel.WEAK, 1, "weak"],
      [PasswordStrengthLevel.MODERATE, 2, "moderate"],
      [PasswordStrengthLevel.STRONG, 3, "strong"],
      [PasswordStrengthLevel.VERY_STRONG, 4, "veryStrong"]
    ])("shows %s with %i active meter segments", (level, score, label) => {
      mockPasswordStrength({ level, score });

      renderPasswordStrengthMeter({ password: "a-password" });

      expect(screen.getByRole("status")).toHaveTextContent(label);
      expect(getActiveSegmentCount()).toBe(score + 1);
    });

    it.each(Object.values(PasswordCrackTimeEstimate))("translates the %s resistance estimate", (estimatedCrackTime) => {
      mockPasswordStrength({ estimatedCrackTime });

      renderPasswordStrengthMeter({ password: "a-password" });

      expect(screen.getByRole("status")).toHaveTextContent(`Estimated resistance: time.${estimatedCrackTime}`);
    });

    it("prefers a warning over suggestions", () => {
      mockPasswordStrength({
        warning: "This password is commonly used",
        suggestions: ["Add more words"]
      });

      renderPasswordStrengthMeter({ password: "password" });

      expect(screen.getByRole("status")).toHaveTextContent("This password is commonly used");
      expect(screen.getByRole("status")).not.toHaveTextContent("Add more words");
    });

    it("uses the first suggestion when there is no warning", () => {
      mockPasswordStrength({
        suggestions: ["Add more words", "Avoid common phrases"]
      });

      renderPasswordStrengthMeter({ password: "password" });

      expect(screen.getByRole("status")).toHaveTextContent("Add more words");
      expect(screen.getByRole("status")).not.toHaveTextContent("Avoid common phrases");
    });

    it("updates its result when the password changes", () => {
      estimatePasswordStrength
        .mockReturnValueOnce(createPasswordStrengthResult({
          level: PasswordStrengthLevel.WEAK,
          score: 1,
          estimatedCrackTime: PasswordCrackTimeEstimate.MINUTES
        }))
        .mockReturnValueOnce(createPasswordStrengthResult({
          level: PasswordStrengthLevel.VERY_STRONG,
          score: 4,
          estimatedCrackTime: PasswordCrackTimeEstimate.CENTURIES
        }));

      const { rerender } = renderPasswordStrengthMeter({ password: "weak-password" });

      expect(screen.getByRole("status")).toHaveTextContent("weak");
      expect(getActiveSegmentCount()).toBe(2);

      rerender(<PasswordStrengthMeter password="much stronger password" theme={SystemTheme.LIGHT} />);

      expect(screen.getByRole("status")).toHaveTextContent("veryStrong");
      expect(getActiveSegmentCount()).toBe(5);
    });
  });

  describe("theme styling", () => {
    it.each([SystemTheme.LIGHT, SystemTheme.DARK])("uses %s theme colors for non-strength content", (theme) => {
      mockPasswordStrength();

      renderPasswordStrengthMeter({ password: "a-password", theme });

      const colors = getAppColors(theme);
      const status = screen.getByRole("status");

      expect(status.style.getPropertyValue("--password-strength-muted-text")).toBe(colors.SETTINGS_SECTION_TEXT);
      expect(status.style.getPropertyValue("--password-strength-track")).toBe(colors.SETTINGS_DIVIDER);
      expect(status.style.getPropertyValue("--password-strength-text")).toBe(colors.SETTINGS_NAV_TEXT);
    });
  });
});

function renderPasswordStrengthMeter(props?: Partial<ComponentProps<typeof PasswordStrengthMeter>>) {
  return render(
    <PasswordStrengthMeter
      password=""
      theme={SystemTheme.LIGHT}
      {...props}
    />
  );
}

function getActiveSegmentCount(): number {
  const meterTrack = screen.getByRole("status").querySelector("[aria-hidden=\"true\"]");

  if (!meterTrack) {
    throw new Error("Could not find the password strength meter track.");
  }

  return Array.from(meterTrack.querySelectorAll("span")).filter((segment) => {
    return segment.className.includes("passwordStrengthSegmentActive");
  }).length;
}

function mockPasswordStrength(overrides = {}) {
  estimatePasswordStrength.mockReturnValue(createPasswordStrengthResult(overrides));
}

function createPasswordStrengthResult(overrides = {}) {
  return {
    level: PasswordStrengthLevel.MODERATE,
    score: 2,
    estimatedCrackTime: PasswordCrackTimeEstimate.HOURS,
    suggestions: [],
    ...overrides
  };
}
