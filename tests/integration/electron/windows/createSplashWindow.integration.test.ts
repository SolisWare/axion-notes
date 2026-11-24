/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindowConstructorOptions } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSplashWindow } from "../../../../electron/windows/createSplashWindow";

type TestWindow = {
  loadFile: ReturnType<typeof vi.fn>;
  options: BrowserWindowConstructorOptions;
  webContents: {
    getURL: ReturnType<typeof vi.fn>;
    loadURL: ReturnType<typeof vi.fn>;
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
    readonly loadFile = vi.fn();
    readonly once = vi.fn();
    readonly show = vi.fn();
    readonly options: BrowserWindowConstructorOptions;
    readonly webContents = {
      closeDevTools: vi.fn(),
      getURL: vi.fn(() => ""),
      loadURL: vi.fn(async () => undefined),
      on: vi.fn(),
      setWindowOpenHandler: vi.fn()
    };

    constructor(options: BrowserWindowConstructorOptions) {
      this.options = options;
      mocks.windows.push(this as unknown as TestWindow);
    }
  }

  return {
    app: { isPackaged: true },
    BrowserWindow,
    shell: { openExternal: mocks.openExternal }
  };
});

vi.mock("../../../../electron/utils/appIcon", () => ({
  getAppIconPath: () => "/app/icon.png",
  getWindowIconPath: () => "/app/icon.png"
}));

beforeEach(() => {
  mocks.openExternal.mockReset();
  mocks.openExternal.mockResolvedValue(undefined);
  mocks.windows.splice(0);
});

describe("createSplashWindow integration", () => {
  it("installs the real navigation guard with the splash page as its only allowed local destination", () => {
    const splashWindow = createSplashWindow() as unknown as TestWindow;
    const splashFilePath = splashWindow.loadFile.mock.calls[0][0] as string;
    const openHandler = splashWindow.webContents.setWindowOpenHandler.mock.calls[0][0];
    const navigationRegistration = splashWindow.webContents.on.mock.calls.find(([eventName]) => eventName === "will-navigate");
    const navigationEvent = { preventDefault: vi.fn() };

    expect(splashWindow.options.webPreferences).toMatchObject({
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    });
    expect(openHandler({ url: "https://example.com" })).toEqual({ action: "deny" });
    expect(mocks.openExternal).toHaveBeenCalledWith("https://example.com");

    if (!navigationRegistration) {
      throw new Error("Could not find the splash navigation guard.");
    }

    (navigationRegistration[1] as (event: typeof navigationEvent, url: string) => void)(navigationEvent, `file://${splashFilePath}`);
    expect(navigationEvent.preventDefault).not.toHaveBeenCalled();
  });
});
