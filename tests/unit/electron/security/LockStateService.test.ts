/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import type { BrowserWindow } from "electron";
import { describe, expect, it, vi } from "vitest";
import { LockStateService } from "../../../../electron/security/LockStateService";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";

vi.mock("electron", () => ({
  powerMonitor: {
    on: vi.fn()
  }
}));

describe("LockStateService content protection", () => {
  it("applies content protection while the lock screen is enabled, even when notes are unlocked", () => {
    const service = new LockStateService(
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );
    const mainWindow = createMainWindow();
    service.registerMainWindow(mainWindow.window);

    service.applySettings({
      ...defaultAppSettings,
      lockScreenEnabled: true
    });

    expect(mainWindow.setContentProtection).toHaveBeenLastCalledWith(true);
  });

  it("removes content protection immediately when disabled", () => {
    const service = new LockStateService(
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );
    const mainWindow = createMainWindow();
    service.registerMainWindow(mainWindow.window);
    service.applySettings({
      ...defaultAppSettings,
      lockScreenEnabled: true
    });
    expect(mainWindow.setContentProtection).toHaveBeenLastCalledWith(true);

    service.applySettings({
      ...defaultAppSettings,
      lockScreenEnabled: true,
      lockScreenContentProtectionEnabled: false
    });

    expect(mainWindow.setContentProtection).toHaveBeenLastCalledWith(false);
  });
});

function createMainWindow(): {
  setContentProtection: ReturnType<typeof vi.fn>;
  window: BrowserWindow;
} {
  const setContentProtection = vi.fn();

  return {
    setContentProtection,
    window: {
      isDestroyed: vi.fn(() => false),
      on: vi.fn(),
      setContentProtection,
      webContents: {
        executeJavaScript: vi.fn().mockResolvedValue(undefined),
        getURL: vi.fn(() => "file:///index.html#/main/lock"),
        isDestroyed: vi.fn(() => false),
        on: vi.fn()
      }
    } as unknown as BrowserWindow
  };
}
