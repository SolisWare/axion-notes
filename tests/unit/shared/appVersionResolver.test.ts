/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppVersionConfig } from "../../../src/utils/app-version/AppVersionConfig";
import { AppVersionResolver } from "../../../src/utils/app-version/AppVersionResolver";

const originalGithubRunNumber = process.env.GITHUB_RUN_NUMBER;

beforeEach(() => {
  delete process.env.GITHUB_RUN_NUMBER;
});

afterEach(() => {
  if (originalGithubRunNumber === undefined) {
    delete process.env.GITHUB_RUN_NUMBER;
  } else {
    process.env.GITHUB_RUN_NUMBER = originalGithubRunNumber;
  }
});

describe("AppVersionResolver", () => {
  it("builds stable and prerelease versions from configuration", () => {
    expect(AppVersionResolver.getCombinedVersion(config())).toMatch(/^\d+\.\d+\.\d+$/);
    expect(AppVersionResolver.getCombinedVersion(config({ buildVersion: 42, preReleaseVersion: "beta.2" })))
      .toMatch(/^\d+\.\d+\.\d+-beta\.2-b42$/);
  });

  it("uses the GitHub run number as the build version when available", () => {
    process.env.GITHUB_RUN_NUMBER = "81";

    expect(AppVersionResolver.getCombinedVersion(config({ buildVersion: 12 }))).toMatch(/^\d+\.\d+\.\d+-b81$/);
  });

  it("validates version numbers, prereleases, and GitHub build numbers", () => {
    expect(() => AppVersionResolver.getCombinedVersion(config({ majorVersion: -1 }))).toThrow("non-negative integers");
    expect(() => AppVersionResolver.getCombinedVersion(config({ minorVersion: 1.5 }))).toThrow("non-negative integers");
    expect(() => AppVersionResolver.getCombinedVersion(config({ preReleaseVersion: "  " }))).toThrow("non-empty string");
    expect(() => AppVersionResolver.getCombinedVersion(config({ buildVersion: -1 }))).toThrow("non-negative integer");

    process.env.GITHUB_RUN_NUMBER = "invalid";
    expect(() => AppVersionResolver.getCombinedVersion(config())).toThrow("GITHUB_RUN_NUMBER");
  });

  it("returns optional codenames and validates invalid codenames", () => {
    expect(AppVersionResolver.getAboutVersion(config())).toBeUndefined();
    expect(AppVersionResolver.getAboutVersion(config({ releaseCodename: "Vault" }))).toBe("Vault");
    expect(AppVersionResolver.getAboutDisplayVersion(config())).toMatch(/^\d+\.\d+\.\d+$/);
    expect(AppVersionResolver.getAboutDisplayVersion(config({ releaseCodename: "Vault" }))).toMatch(/^\d+\.\d+\.\d+ \(Vault\)$/);
    expect(() => AppVersionResolver.getAboutVersion(config({ releaseCodename: "" }))).toThrow("non-empty string");
  });

  it("formats short display versions and prerelease labels", () => {
    expect(AppVersionResolver.getShortDisplayVersion(config())).toMatch(/^v\d+\.\d+$/);
    expect(AppVersionResolver.getShortDisplayVersion(config({ patchVersion: 3 }))).toMatch(/^v\d+\.\d+\.3$/);
    expect(AppVersionResolver.getShortDisplayVersion(config({ preReleaseVersion: "alpha.1" }))).toMatch(/^v\d+\.\d+ \(Alpha 1\)$/);
    expect(AppVersionResolver.getShortDisplayVersion(config({ preReleaseVersion: "BETA" }))).toMatch(/^v\d+\.\d+ \(Beta\)$/);
    expect(AppVersionResolver.getShortDisplayVersion(config({ preReleaseVersion: "rc.4" }))).toMatch(/^v\d+\.\d+ \(RC 4\)$/);
    expect(AppVersionResolver.getShortDisplayVersion(config({ preReleaseVersion: "preview.7" }))).toMatch(/^v\d+\.\d+ \(preview 7\)$/);
    expect(() => AppVersionResolver.getShortDisplayVersion(config({ majorVersion: -1 }))).toThrow("non-negative integers");
    expect(() => AppVersionResolver.getShortDisplayVersion(config({ preReleaseVersion: "  " }))).toThrow("non-empty string");
  });
});

function config(overrides: Partial<AppVersionConfig> = {}): AppVersionConfig {
  return {
    majorVersion: 0,
    minorVersion: 5,
    patchVersion: 0,
    ...overrides
  };
}
