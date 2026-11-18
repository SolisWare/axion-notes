/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const fs = vi.hoisted(() => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}));
const getCombinedVersion = vi.hoisted(() => vi.fn());

vi.mock("node:fs", () => fs);
vi.mock("../../../../../src/utils/app-version/AppVersionResolver", () => ({
  AppVersionResolver: { getCombinedVersion }
}));

describe("AppVersionUpdater", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  it("synchronizes the package files and README badges when a lockfile exists", async () => {
    getCombinedVersion.mockReturnValue("0.5.0-beta.2");
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.endsWith("app-version-config.json")) {
        return "{}";
      }

      if (filePath.endsWith("package-lock.json")) {
        return JSON.stringify({ packages: { "": { name: "axion-notes", version: "old" } }, version: "old" });
      }

      if (filePath.endsWith("package.json")) {
        return JSON.stringify({ name: "axion-notes", version: "old" });
      }

      return "![Version](https://img.shields.io/badge/version-old-green)\n![Last Modified](https://img.shields.io/badge/last%20modified-old-blue)";
    });

    await import("../../../../../electron/utils/app-version/AppVersionUpdater");

    expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
    expect(writeFor("package.json")).toContain('"version": "0.5.0-beta.2"');
    expect(writeFor("package-lock.json")).toContain('"version": "0.5.0-beta.2"');
    expect(writeFor("package-lock.json")).toContain('"name": "axion-notes"');
    expect(writeFor("README.md")).toContain("version-0.5--beta.2-green");
    expect(writeFor("README.md")).toMatch(/last%20modified-[A-Za-z]+%20\d{4}-blue/);
    expect(console.log).toHaveBeenCalledWith("Synchronized release version 0.5.0-beta.2.");
  });

  it("updates package metadata and README without requiring a lockfile", async () => {
    getCombinedVersion.mockReturnValue("1.4.0");
    fs.existsSync.mockReturnValue(false);
    fs.readFileSync.mockImplementation((filePath: string) => filePath.endsWith("README.md")
      ? "![Version](https://img.shields.io/badge/version-old-green)"
      : "{}");

    await import("../../../../../electron/utils/app-version/AppVersionUpdater");

    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(expect.stringContaining("package-lock.json"), expect.anything());
    expect(writeFor("README.md")).toContain("version-1.4-green");
  });

  it("updates a lockfile without a root package entry", async () => {
    getCombinedVersion.mockReturnValue("1.4.1");
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.endsWith("app-version-config.json")) {
        return "{}";
      }

      if (filePath.endsWith("package-lock.json")) {
        return JSON.stringify({ lockfileVersion: 3, version: "old" });
      }

      return filePath.endsWith("README.md") ? "" : "{}";
    });

    await import("../../../../../electron/utils/app-version/AppVersionUpdater");

    expect(writeFor("package-lock.json")).toContain('"version": "1.4.1"');
  });
});

function writeFor(fileName: string): string {
  const call = fs.writeFileSync.mock.calls.find(([filePath]: [string]) => filePath.endsWith(fileName));

  if (!call) {
    throw new Error(`Expected ${fileName} to be written.`);
  }

  return call[1] as string;
}
