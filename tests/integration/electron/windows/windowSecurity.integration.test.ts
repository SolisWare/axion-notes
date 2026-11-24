/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindowConstructorOptions } from "electron";
import { afterEach, describe, expect, it, vi } from "vitest";
import { closeSettingsWindow, createSettingsWindow } from "../../../../electron/windows/createSettingsWindow";

type TestWindow = {
  options: BrowserWindowConstructorOptions;
  close: ReturnType<typeof vi.fn>;
  isDestroyed: ReturnType<typeof vi.fn>;
  webContents: {
    on: ReturnType<typeof vi.fn>;
    setWindowOpenHandler: ReturnType<typeof vi.fn>;
  };
};

const mocks = vi.hoisted(() => ({
  openExternal: vi.fn(),
  windows: [] as TestWindow[]
}));

vi.mock("electron", () => {
  class BrowserWindow {
    readonly options: BrowserWindowConstructorOptions;
    readonly close = vi.fn(() => this.events.get("closed")?.());
    readonly isDestroyed = vi.fn(() => false);
    readonly isMinimized = vi.fn(() => false);
    readonly moveTop = vi.fn();
    readonly focus = vi.fn();
    readonly restore = vi.fn();
    readonly setMenu = vi.fn();
    readonly setMenuBarVisibility = vi.fn();
    readonly setTitle = vi.fn();
    readonly show = vi.fn();
    readonly loadFile = vi.fn();
    readonly loadURL = vi.fn();
    readonly events = new Map<string, (...args: unknown[]) => void>();
    readonly webContents = {
      closeDevTools: vi.fn(),
      on: vi.fn((event: string, listener: (...args: unknown[]) => void) => this.events.set(`web:${event}`, listener)),
      setWindowOpenHandler: vi.fn()
    };

    constructor(options: BrowserWindowConstructorOptions) {
      this.options = options;
      mocks.windows.push(this as unknown as TestWindow);
    }

    on(event: string, listener: (...args: unknown[]) => void): void {
      this.events.set(event, listener);
    }

    once(event: string, listener: (...args: unknown[]) => void): void {
      this.events.set(event, listener);
    }

    static getAllWindows(): BrowserWindow[] {
      return mocks.windows as unknown as BrowserWindow[];
    }
  }

  return {
    app: { isPackaged: true },
    BrowserWindow,
    shell: { openExternal: mocks.openExternal }
  };
});

vi.mock("../../../../electron/utils/electronI18n", () => ({
  translate: () => "Settings"
}));

vi.mock("../../../../electron/utils/appIcon", () => ({
  getAppIconPath: () => "/app/icon.png",
  getWindowIconPath: () => "/app/icon.png"
}));

afterEach(() => {
  closeSettingsWindow();
  mocks.openExternal.mockReset();
  mocks.openExternal.mockResolvedValue(undefined);
  mocks.windows.splice(0);
});

describe("window security integration", () => {
  it("applies hardened preferences and navigation guards when creating the Settings window", () => {
    const settingsWindow = createSettingsWindow() as unknown as TestWindow;

    expect(settingsWindow.options.webPreferences).toMatchObject({
      allowRunningInsecureContent: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    });
    expect(settingsWindow.options.webPreferences?.preload).toMatch(/electron[\\/]preload[\\/]preload\.js$/);

    const openHandler = settingsWindow.webContents.setWindowOpenHandler.mock.calls[0][0];
    const navigationRegistration = settingsWindow.webContents.on.mock.calls.find(([eventName]) => eventName === "will-navigate");
    const navigationEvent = { preventDefault: vi.fn() };

    expect(openHandler({ url: "https://example.com" })).toEqual({ action: "deny" });
    expect(mocks.openExternal).toHaveBeenCalledWith("https://example.com");

    if (!navigationRegistration) {
      throw new Error("Could not find the Settings window navigation guard.");
    }

    (navigationRegistration[1] as (event: typeof navigationEvent, url: string) => void)(navigationEvent, "javascript:alert('unsafe')");
    expect(navigationEvent.preventDefault).toHaveBeenCalledOnce();
    expect(mocks.openExternal).toHaveBeenCalledTimes(1);
  });
});
