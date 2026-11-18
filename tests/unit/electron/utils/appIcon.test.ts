/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const isDev = vi.hoisted(() => ({ value: true }));
const existsSync = vi.hoisted(() => vi.fn());

vi.mock("node:fs", () => ({ existsSync }));
vi.mock("../../../../electron/utils/isDev", () => ({
  get isDev() {
    return isDev.value;
  }
}));

import { getAppIconPath, getWindowIconPath } from "../../../../electron/utils/appIcon";

describe("appIcon", () => {
  beforeEach(() => {
    isDev.value = true;
    existsSync.mockReset();
  });

  it("uses the public icon when running in development", () => {
    const iconPath = path.join(process.cwd(), "public/axion_notes_icon1024.png");
    existsSync.mockImplementation((candidate: string) => candidate === iconPath);

    expect(getAppIconPath()).toBe(iconPath);
  });

  it("falls back to the packaged development icon when the public icon is unavailable", () => {
    const fallbackPath = path.join(process.cwd(), "app_favicon.ico");
    existsSync.mockImplementation((candidate: string) => candidate === fallbackPath);

    expect(getWindowIconPath()).toBe(fallbackPath);
  });

  it("only checks the packaged location in production", () => {
    isDev.value = false;
    const packagedPath = path.join(process.cwd(), "axion_notes_icon1024.png");
    existsSync.mockReturnValue(true);

    expect(getAppIconPath()).toBe(packagedPath);
    expect(existsSync).toHaveBeenCalledTimes(1);
  });

  it("reports every checked location when an icon cannot be found", () => {
    existsSync.mockReturnValue(false);

    expect(() => getAppIconPath()).toThrow("App icon not found. Checked:");
  });
});
