/**
 * Copyright (c) 2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppVersionConfig } from "./AppVersionConfig";

export class AppVersionResolver {

  public static getCombinedVersion(appVersionConfig: AppVersionConfig): string {
    const { majorVersion, minorVersion, patchVersion, preReleaseVersion } = appVersionConfig;
    const buildVersion = AppVersionResolver.getResolvedBuildVersion(appVersionConfig);

    if (![majorVersion, minorVersion, patchVersion].every((value) => Number.isInteger(value) && value >= 0)) {
      throw new Error("majorVersion, minorVersion, and patchVersion must be non-negative integers.");
    }

    if (preReleaseVersion !== undefined && (typeof preReleaseVersion !== "string" || preReleaseVersion.trim() === "")) {
      throw new Error("preReleaseVersion must be a non-empty string when provided.");
    }

    if (buildVersion !== undefined && (!Number.isInteger(buildVersion) || buildVersion < 0)) {
      throw new Error("buildVersion must be a non-negative integer when provided.");
    }

    const preReleaseSuffix = preReleaseVersion ? `-${preReleaseVersion}` : "";
    const buildSuffix = buildVersion !== undefined ? `-b${buildVersion}` : "";

    return `${majorVersion}.${minorVersion}.${patchVersion}${preReleaseSuffix}${buildSuffix}`;
  }

  public static getAboutVersion(appVersionConfig: AppVersionConfig): string | undefined {
    const { releaseCodename } = appVersionConfig;

    if (releaseCodename !== undefined && (typeof releaseCodename !== "string" || releaseCodename.trim() === "")) {
      throw new Error("releaseCodename must be a non-empty string when provided.");
    }

    return releaseCodename;
  }

  public static getShortDisplayVersion(appVersionConfig: AppVersionConfig): string {
    const { majorVersion, minorVersion, patchVersion, preReleaseVersion } = appVersionConfig;

    if (![majorVersion, minorVersion, patchVersion].every((value) => Number.isInteger(value) && value >= 0)) {
      throw new Error("majorVersion, minorVersion, and patchVersion must be non-negative integers.");
    }

    if (preReleaseVersion !== undefined && (typeof preReleaseVersion !== "string" || preReleaseVersion.trim() === "")) {
      throw new Error("preReleaseVersion must be a non-empty string when provided.");
    }

    const shortVersion = patchVersion === 0
      ? `v${majorVersion}.${minorVersion}`
      : `v${majorVersion}.${minorVersion}.${patchVersion}`;
    const releaseLabel = AppVersionResolver.getPreReleaseDisplayLabel(preReleaseVersion);

    return releaseLabel ? `${shortVersion} (${releaseLabel})` : shortVersion;
  }

  private static getResolvedBuildVersion(appVersionConfig: AppVersionConfig): number | undefined {
    const githubRunNumber = process.env.GITHUB_RUN_NUMBER;

    if (githubRunNumber !== undefined && githubRunNumber.trim() !== "") {
      const parsedGithubRunNumber = Number.parseInt(githubRunNumber, 10);

      if (!Number.isInteger(parsedGithubRunNumber) || parsedGithubRunNumber < 0) {
        throw new Error("GITHUB_RUN_NUMBER must be a non-negative integer when provided.");
      }

      return parsedGithubRunNumber;
    }

    const { buildVersion } = appVersionConfig;

    if (buildVersion !== undefined && (!Number.isInteger(buildVersion) || buildVersion < 0)) {
      throw new Error("buildVersion must be a non-negative integer when provided.");
    }

    return buildVersion;
  }

  private static getPreReleaseDisplayLabel(preReleaseVersion?: string): string | undefined {
    if (!preReleaseVersion) {
      return undefined;
    }

    const [keyword, suffix] = preReleaseVersion.split(".", 2);
    const releaseLabelMap: Record<string, string> = {
      alpha: "Alpha",
      beta: "Beta",
      rc: "RC"
    };
    const normalizedKeyword = keyword.toLowerCase();
    const mappedKeyword = releaseLabelMap[normalizedKeyword] ?? keyword;

    return suffix ? `${mappedKeyword} ${suffix}` : mappedKeyword;
  }

}
