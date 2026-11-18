/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const electronApp = vi.hoisted(() => ({ isPackaged: false }));
const originalElectronIsDev = process.env.ELECTRON_IS_DEV;

vi.mock("electron", () => ({ app: electronApp }));

describe("isDev", () => {
  beforeEach(() => {
    delete process.env.ELECTRON_IS_DEV;
    electronApp.isPackaged = false;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalElectronIsDev === undefined) {
      delete process.env.ELECTRON_IS_DEV;
    } else {
      process.env.ELECTRON_IS_DEV = originalElectronIsDev;
    }
  });

  it("uses Electron packaging state when ELECTRON_IS_DEV is not set", async () => {
    electronApp.isPackaged = false;
    await expect(loadIsDev()).resolves.toBe(true);

    vi.resetModules();
    electronApp.isPackaged = true;
    await expect(loadIsDev()).resolves.toBe(false);
  });

  it("uses an explicit development environment value over packaging state", async () => {
    process.env.ELECTRON_IS_DEV = "1";
    electronApp.isPackaged = true;

    await expect(loadIsDev()).resolves.toBe(true);
  });

  it("treats every explicit non-one environment value as production", async () => {
    process.env.ELECTRON_IS_DEV = "0";
    await expect(loadIsDev()).resolves.toBe(false);

    vi.resetModules();
    process.env.ELECTRON_IS_DEV = "unexpected";
    await expect(loadIsDev()).resolves.toBe(false);
  });
});

async function loadIsDev(): Promise<boolean> {
  return (await import("../../../../electron/utils/isDev")).isDev;
}
