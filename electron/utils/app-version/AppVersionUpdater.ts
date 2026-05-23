/**
 * Copyright (c) 2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { AppVersionConfig } from "../../../src/utils/app-version/AppVersionConfig";
import { AppVersionResolver } from "../../../src/utils/app-version/AppVersionResolver";

export class AppVersionUpdater {
  
  private readonly rootDir = process.cwd();
  private readonly appVersionConfigPath = path.join(this.rootDir, "app-version-config.json");
  private readonly packageJsonPath = path.join(this.rootDir, "package.json");
  private readonly packageLockPath = path.join(this.rootDir, "package-lock.json");
  private readonly readmePath = path.join(this.rootDir, "README.md");

  public run(): void {
    const appVersionConfig = this.readJson<AppVersionConfig>(this.appVersionConfigPath);
    const version = this.getVersion(appVersionConfig);

    this.syncPackageJson(version);
    this.syncPackageLock(version);
    this.syncReadme(version);

    console.log(`Synchronized release version ${version}.`);
  }

  private getVersion(appVersionConfig: AppVersionConfig): string {
    return AppVersionResolver.getCombinedVersion(appVersionConfig);
  }

  private syncPackageJson(version: string): void {
    const packageJson = this.readJson<Record<string, unknown>>(this.packageJsonPath);
    packageJson.version = version;
    this.writeJson(this.packageJsonPath, packageJson);
  }

  private syncPackageLock(version: string): void {
    if (!fs.existsSync(this.packageLockPath)) {
      return;
    }

    const packageLock = this.readJson<Record<string, any>>(this.packageLockPath);
    packageLock.version = version;

    if (packageLock.packages?.[""]) {
      packageLock.packages[""].version = version;
    }

    this.writeJson(this.packageLockPath, packageLock);
  }

  private syncReadme(version: string): void {
    const readme = fs.readFileSync(this.readmePath, "utf-8");
    const versionBadge = `![Version](https://img.shields.io/badge/version-${this.toShieldsValue(this.getBadgeVersion(version))}-green)`;
    const lastModifiedBadge = `![Last Modified](https://img.shields.io/badge/last%20modified-${this.getLastModifiedBadgeValue()}-blue)`;
    const updatedReadme = readme
      .replace(
        /!\[Last Modified\]\(https:\/\/img\.shields\.io\/badge\/last%20modified-[^)]+\)/,
        lastModifiedBadge
      )
      .replace(
        /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^)]+\)/,
        versionBadge
      );

    fs.writeFileSync(this.readmePath, updatedReadme);
  }

  private getLastModifiedBadgeValue(): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    });

    return formatter.format(new Date()).replace(/ /g, "%20");
  }

  private toShieldsValue(version: string): string {
    return version.replace(/-/g, "--");
  }

  private getBadgeVersion(version: string): string {
    return version.replace(/(\d+)\.(\d+)\.0(?=$|--|-b)/, "$1.$2");
  }

  private readJson<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  }

  private writeJson(filePath: string, value: unknown): void {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  }
}

new AppVersionUpdater().run();
