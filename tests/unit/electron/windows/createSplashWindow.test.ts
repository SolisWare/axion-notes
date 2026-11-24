/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as path from "node:path";
import type { BrowserWindowConstructorOptions } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSplashWindow } from "../../../../electron/windows/createSplashWindow";

type TestWindow = {
  loadFile: ReturnType<typeof vi.fn>;
  options: BrowserWindowConstructorOptions;
  show: ReturnType<typeof vi.fn>;
  once: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
  blockProductionDevTools: vi.fn(),
  devToolsPreferences: { devTools: false },
  getAppIconPath: vi.fn(() => "/app/icon.png"),
  getWindowIconPath: vi.fn(() => "/app/icon.png"),
  isDev: false,
  isMac: false,
  registerWindowNavigationGuards: vi.fn(),
  windows: [] as TestWindow[]
}));

vi.mock("electron", () => {
  class BrowserWindow {
    readonly loadFile = vi.fn();
    readonly show = vi.fn();
    readonly once = vi.fn();
    readonly options: BrowserWindowConstructorOptions;

    constructor(options: BrowserWindowConstructorOptions) {
      this.options = options;
      mocks.windows.push(this as unknown as TestWindow);
    }
  }

  return { BrowserWindow };
});

vi.mock("../../../../electron/utils/appIcon", () => ({
  getAppIconPath: mocks.getAppIconPath,
  getWindowIconPath: mocks.getWindowIconPath
}));

vi.mock("../../../../electron/utils/devTools", () => ({
  blockProductionDevTools: mocks.blockProductionDevTools,
  getDevToolsWebPreferences: () => mocks.devToolsPreferences
}));

vi.mock("../../../../electron/utils/isDev", () => ({
  get isDev() {
    return mocks.isDev;
  }
}));

vi.mock("../../../../electron/utils/Platform", () => ({
  get isMac() {
    return mocks.isMac;
  }
}));

vi.mock("../../../../electron/windows/windowSecurity", () => ({
  registerWindowNavigationGuards: mocks.registerWindowNavigationGuards
}));

beforeEach(() => {
  mocks.blockProductionDevTools.mockReset();
  mocks.devToolsPreferences = { devTools: false };
  mocks.getAppIconPath.mockClear();
  mocks.getWindowIconPath.mockClear();
  mocks.isDev = false;
  mocks.isMac = false;
  mocks.registerWindowNavigationGuards.mockReset();
  mocks.windows.splice(0);
});

describe("createSplashWindow", () => {
  it("creates a hardened, transparent production splash window and loads its packaged page", () => {
    const splashWindow = createSplashWindow() as unknown as TestWindow;
    const splashFilePath = splashWindow.loadFile.mock.calls[0][0] as string;

    expect(splashWindow.options).toMatchObject({
      backgroundColor: "#00000000",
      center: true,
      frame: false,
      fullscreenable: false,
      height: 188,
      icon: "/app/icon.png",
      maximizable: false,
      minimizable: false,
      movable: true,
      resizable: false,
      show: false,
      skipTaskbar: true,
      transparent: true,
      width: 320,
      webPreferences: {
        contextIsolation: true,
        devTools: false,
        nodeIntegration: false,
        sandbox: true
      }
    });
    expect(splashFilePath).toMatch(/[\\/]splash\.html$/);
    expect(mocks.getWindowIconPath).toHaveBeenCalledOnce();
    expect(mocks.getAppIconPath).not.toHaveBeenCalled();
    expect(mocks.blockProductionDevTools).toHaveBeenCalledWith(splashWindow);
    expect(mocks.registerWindowNavigationGuards).toHaveBeenCalledWith(splashWindow, { allowedFilePaths: [splashFilePath] });
  });

  it("shows only after Electron reports the splash window ready", () => {
    const splashWindow = createSplashWindow() as unknown as TestWindow;
    const readyToShow = splashWindow.once.mock.calls.find(([eventName]) => eventName === "ready-to-show")?.[1] as (() => void) | undefined;

    expect(splashWindow.show).not.toHaveBeenCalled();
    expect(readyToShow).toBeDefined();

    readyToShow?.();

    expect(splashWindow.show).toHaveBeenCalledOnce();
  });

  it("uses the development splash page, DevTools preference, and macOS icon when applicable", () => {
    mocks.devToolsPreferences = { devTools: true };
    mocks.isDev = true;
    mocks.isMac = true;

    const splashWindow = createSplashWindow() as unknown as TestWindow;

    expect(splashWindow.loadFile).toHaveBeenCalledWith(path.join(process.cwd(), "public", "splash.html"));
    expect(splashWindow.options.icon).toBe("/app/icon.png");
    expect(splashWindow.options.webPreferences).toMatchObject({ devTools: true });
    expect(mocks.getAppIconPath).toHaveBeenCalledOnce();
    expect(mocks.getWindowIconPath).not.toHaveBeenCalled();
  });
});
