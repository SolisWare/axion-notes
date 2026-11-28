/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindowConstructorOptions } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLicenseWindow } from "../../../../electron/windows/createLicenseWindow";
import { ElectronWindowId } from "../../../../src/types/ElectronWindowId";

type TestWindow = {
  events: Map<string, (...args: never[]) => void>;
  focus: ReturnType<typeof vi.fn>;
  isDestroyed: ReturnType<typeof vi.fn>;
  isMinimized: ReturnType<typeof vi.fn>;
  loadFile: ReturnType<typeof vi.fn>;
  loadURL: ReturnType<typeof vi.fn>;
  moveTop: ReturnType<typeof vi.fn>;
  options: BrowserWindowConstructorOptions;
  restore: ReturnType<typeof vi.fn>;
  setMenu: ReturnType<typeof vi.fn>;
  setMenuBarVisibility: ReturnType<typeof vi.fn>;
  setTitle: ReturnType<typeof vi.fn>;
  show: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
  blockProductionDevTools: vi.fn(),
  devRoute: vi.fn(),
  getAppIconPath: vi.fn(() => "/app/icon.png"),
  getAppIndexFilePath: vi.fn(() => "/app/index.html"),
  getAppWindowWebPreferences: vi.fn(() => ({ preload: "/app/preload.js" })),
  getWindowIconPath: vi.fn(() => "/window/icon.png"),
  isDev: false,
  isMac: false,
  productionRoute: vi.fn(),
  registerWindowNavigationGuards: vi.fn(),
  translate: vi.fn(() => "License"),
  windows: [] as TestWindow[]
}));

vi.mock("electron", () => {
  class BrowserWindow {
    readonly events = new Map<string, (...args: never[]) => void>();
    readonly focus = vi.fn();
    readonly isDestroyed = vi.fn(() => false);
    readonly isMinimized = vi.fn(() => false);
    readonly loadFile = vi.fn();
    readonly loadURL = vi.fn();
    readonly moveTop = vi.fn();
    readonly restore = vi.fn();
    readonly setMenu = vi.fn();
    readonly setMenuBarVisibility = vi.fn();
    readonly setTitle = vi.fn();
    readonly show = vi.fn();
    readonly options: BrowserWindowConstructorOptions;

    constructor(options: BrowserWindowConstructorOptions) {
      this.options = options;
      mocks.windows.push(this as unknown as TestWindow);
    }

    on(event: string, listener: (...args: never[]) => void): void {
      this.events.set(event, listener);
    }

    once(event: string, listener: (...args: never[]) => void): void {
      this.events.set(event, listener);
    }
  }

  return { BrowserWindow };
});

vi.mock("../../../../electron/utils/appIcon", () => ({
  getAppIconPath: mocks.getAppIconPath,
  getWindowIconPath: mocks.getWindowIconPath
}));

vi.mock("../../../../electron/utils/devTools", () => ({
  blockProductionDevTools: mocks.blockProductionDevTools
}));

vi.mock("../../../../electron/utils/electronI18n", () => ({
  translate: mocks.translate
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

vi.mock("../../../../electron/windows/routes", () => ({
  dev: mocks.devRoute,
  production: mocks.productionRoute
}));

vi.mock("../../../../electron/windows/windowSecurity", () => ({
  getAppIndexFilePath: mocks.getAppIndexFilePath,
  getAppWindowWebPreferences: mocks.getAppWindowWebPreferences,
  registerWindowNavigationGuards: mocks.registerWindowNavigationGuards
}));

beforeEach(() => {
  mocks.blockProductionDevTools.mockClear();
  mocks.devRoute.mockReset();
  mocks.devRoute.mockReturnValue("http://127.0.0.1:3000/#/license");
  mocks.getAppIconPath.mockClear();
  mocks.getAppIndexFilePath.mockClear();
  mocks.getAppWindowWebPreferences.mockClear();
  mocks.getWindowIconPath.mockClear();
  mocks.isDev = false;
  mocks.isMac = false;
  mocks.productionRoute.mockReset();
  mocks.productionRoute.mockReturnValue(["/app/index.html", { hash: "/license" }]);
  mocks.registerWindowNavigationGuards.mockClear();
  mocks.translate.mockClear();
  mocks.windows.splice(0);
});

afterEach(() => {
  mocks.windows.forEach((window) => getWindowEventHandler(window, "closed")());
});

describe("createLicenseWindow", () => {
  it("creates the localized hardened production window with fixed license-window controls", () => {
    const licenseWindow = createLicenseWindow() as unknown as TestWindow;

    expect(licenseWindow.options).toMatchObject({
      autoHideMenuBar: true,
      closable: true,
      fullscreenable: false,
      height: 520,
      icon: "/window/icon.png",
      maximizable: false,
      minHeight: 330,
      minimizable: false,
      minWidth: 430,
      resizable: false,
      show: false,
      title: "Axion Notes — License",
      width: 560,
      webPreferences: { preload: "/app/preload.js" }
    });
    expect(licenseWindow.setMenu).toHaveBeenCalledWith(null);
    expect(licenseWindow.setMenuBarVisibility).toHaveBeenCalledWith(false);
    expect(mocks.blockProductionDevTools).toHaveBeenCalledWith(licenseWindow);
    expect(mocks.registerWindowNavigationGuards).toHaveBeenCalledWith(licenseWindow, { allowedFilePaths: ["/app/index.html"] });
    expect(mocks.productionRoute).toHaveBeenCalledWith(ElectronWindowId.LICENSE);
    expect(licenseWindow.loadFile).toHaveBeenCalledWith("/app/index.html", { hash: "/license" });
  });

  it("shows when ready and prevents page content from changing the localized title", () => {
    const licenseWindow = createLicenseWindow() as unknown as TestWindow;
    const titleEvent = { preventDefault: vi.fn() };

    getWindowEventHandler(licenseWindow, "ready-to-show")();
    getWindowEventHandler(licenseWindow, "page-title-updated")(titleEvent as never);

    expect(licenseWindow.show).toHaveBeenCalledOnce();
    expect(titleEvent.preventDefault).toHaveBeenCalledOnce();
    expect(licenseWindow.setTitle).toHaveBeenCalledWith("Axion Notes — License");
  });

  it("reuses, restores, and focuses the existing minimized window", () => {
    const licenseWindow = createLicenseWindow() as unknown as TestWindow;
    licenseWindow.isMinimized.mockReturnValue(true);

    expect(createLicenseWindow()).toBe(licenseWindow);
    expect(mocks.windows).toHaveLength(1);
    expect(licenseWindow.restore).toHaveBeenCalledOnce();
    expect(licenseWindow.show).toHaveBeenCalledOnce();
    expect(licenseWindow.moveTop).toHaveBeenCalledOnce();
    expect(licenseWindow.focus).toHaveBeenCalledOnce();
  });

  it("focuses an existing non-minimized window without restoring it", () => {
    const licenseWindow = createLicenseWindow() as unknown as TestWindow;

    createLicenseWindow();

    expect(licenseWindow.restore).not.toHaveBeenCalled();
    expect(licenseWindow.show).toHaveBeenCalledOnce();
    expect(licenseWindow.moveTop).toHaveBeenCalledOnce();
    expect(licenseWindow.focus).toHaveBeenCalledOnce();
  });

  it("creates a replacement after close or destruction without allowing a stale close to clear it", () => {
    const firstWindow = createLicenseWindow() as unknown as TestWindow;
    getWindowEventHandler(firstWindow, "closed")();
    const replacementAfterClose = createLicenseWindow() as unknown as TestWindow;
    replacementAfterClose.isDestroyed.mockReturnValue(true);
    const replacementAfterDestroy = createLicenseWindow() as unknown as TestWindow;

    getWindowEventHandler(replacementAfterClose, "closed")();

    expect(mocks.windows).toHaveLength(3);
    expect(createLicenseWindow()).toBe(replacementAfterDestroy);
  });

  it("uses the development route and macOS app icon when applicable", () => {
    mocks.isDev = true;
    mocks.isMac = true;

    const licenseWindow = createLicenseWindow() as unknown as TestWindow;

    expect(mocks.devRoute).toHaveBeenCalledWith(ElectronWindowId.LICENSE);
    expect(licenseWindow.loadURL).toHaveBeenCalledWith("http://127.0.0.1:3000/#/license");
    expect(licenseWindow.loadFile).not.toHaveBeenCalled();
    expect(mocks.getAppIconPath).toHaveBeenCalledOnce();
    expect(mocks.getWindowIconPath).not.toHaveBeenCalled();
  });
});

function getWindowEventHandler(window: TestWindow, eventName: string): (...args: never[]) => void {
  const handler = window.events.get(eventName);

  if (!handler) {
    throw new Error(`Could not find the ${eventName} handler.`);
  }

  return handler;
}
