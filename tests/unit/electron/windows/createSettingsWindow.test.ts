/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindowConstructorOptions } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeSettingsWindow, createSettingsWindow } from "../../../../electron/windows/createSettingsWindow";
import { ElectronWindowId } from "../../../../src/types/ElectronWindowId";

type TestWindow = {
  close: ReturnType<typeof vi.fn>;
  events: Map<string, (...args: unknown[]) => void>;
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
  getWindowIconPath: vi.fn(() => "/app/icon.png"),
  isDev: false,
  isMac: false,
  productionRoute: vi.fn(),
  registerWindowNavigationGuards: vi.fn(),
  translate: vi.fn(() => "Settings"),
  windows: [] as TestWindow[]
}));

vi.mock("electron", () => {
  class BrowserWindow {
    readonly events = new Map<string, (...args: unknown[]) => void>();
    readonly close = vi.fn(() => this.events.get("closed")?.());
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

    on(event: string, listener: (...args: unknown[]) => void): void {
      this.events.set(event, listener);
    }

    once(event: string, listener: (...args: unknown[]) => void): void {
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
  mocks.blockProductionDevTools.mockReset();
  mocks.devRoute.mockReset();
  mocks.devRoute.mockReturnValue("http://localhost:3000/#/settings");
  mocks.getAppIconPath.mockClear();
  mocks.getAppIndexFilePath.mockClear();
  mocks.getAppWindowWebPreferences.mockClear();
  mocks.getWindowIconPath.mockClear();
  mocks.isDev = false;
  mocks.isMac = false;
  mocks.productionRoute.mockReset();
  mocks.productionRoute.mockReturnValue(["/app/index.html", { hash: "/settings" }]);
  mocks.registerWindowNavigationGuards.mockReset();
  mocks.translate.mockClear();
  mocks.windows.splice(0);
});

afterEach(() => {
  closeSettingsWindow();
});

describe("createSettingsWindow", () => {
  it("creates the localized production window with its fixed settings-window configuration", () => {
    const settingsWindow = createSettingsWindow() as unknown as TestWindow;

    expect(settingsWindow.options).toMatchObject({
      autoHideMenuBar: true,
      fullscreenable: false,
      height: 572,
      icon: "/app/icon.png",
      maximizable: false,
      minHeight: 420,
      minWidth: 600,
      resizable: false,
      show: false,
      title: "Axion Notes — Settings",
      width: 730,
      webPreferences: { preload: "/app/preload.js" }
    });
    expect(settingsWindow.setMenu).toHaveBeenCalledWith(null);
    expect(settingsWindow.setMenuBarVisibility).toHaveBeenCalledWith(false);
    expect(mocks.blockProductionDevTools).toHaveBeenCalledWith(settingsWindow);
    expect(mocks.registerWindowNavigationGuards).toHaveBeenCalledWith(settingsWindow, { allowedFilePaths: ["/app/index.html"] });
    expect(mocks.productionRoute).toHaveBeenCalledWith(ElectronWindowId.SETTINGS);
    expect(settingsWindow.loadFile).toHaveBeenCalledWith("/app/index.html", { hash: "/settings" });
    expect(settingsWindow.loadURL).not.toHaveBeenCalled();
  });

  it("shows when ready and prevents pages from changing its localized title", () => {
    const settingsWindow = createSettingsWindow() as unknown as TestWindow;
    const readyToShow = getWindowEventHandler(settingsWindow, "ready-to-show");
    const titleUpdated = getWindowEventHandler(settingsWindow, "page-title-updated");
    const titleEvent = { preventDefault: vi.fn() };

    readyToShow();
    titleUpdated(titleEvent);

    expect(settingsWindow.show).toHaveBeenCalledOnce();
    expect(titleEvent.preventDefault).toHaveBeenCalledOnce();
    expect(settingsWindow.setTitle).toHaveBeenCalledWith("Axion Notes — Settings");
  });

  it("returns the existing window, restoring and focusing it if it was minimized", () => {
    const existingWindow = createSettingsWindow() as unknown as TestWindow;
    existingWindow.isMinimized.mockReturnValue(true);

    const focusedWindow = createSettingsWindow();

    expect(focusedWindow).toBe(existingWindow);
    expect(mocks.windows).toHaveLength(1);
    expect(existingWindow.restore).toHaveBeenCalledOnce();
    expect(existingWindow.show).toHaveBeenCalledOnce();
    expect(existingWindow.moveTop).toHaveBeenCalledOnce();
    expect(existingWindow.focus).toHaveBeenCalledOnce();
  });

  it("focuses an existing non-minimized window without restoring it", () => {
    const existingWindow = createSettingsWindow() as unknown as TestWindow;

    createSettingsWindow();

    expect(existingWindow.restore).not.toHaveBeenCalled();
    expect(existingWindow.show).toHaveBeenCalledOnce();
    expect(existingWindow.moveTop).toHaveBeenCalledOnce();
    expect(existingWindow.focus).toHaveBeenCalledOnce();
  });

  it("creates a replacement after the existing window closes or is destroyed", () => {
    const firstWindow = createSettingsWindow() as unknown as TestWindow;
    firstWindow.close();

    const replacementAfterClose = createSettingsWindow() as unknown as TestWindow;
    replacementAfterClose.isDestroyed.mockReturnValue(true);
    const replacementAfterDestroy = createSettingsWindow() as unknown as TestWindow;

    expect(replacementAfterClose).not.toBe(firstWindow);
    expect(replacementAfterDestroy).not.toBe(replacementAfterClose);
    expect(mocks.windows).toHaveLength(3);
  });

  it("does not close a destroyed Settings window and ignores a stale closed event", () => {
    const firstWindow = createSettingsWindow() as unknown as TestWindow;
    firstWindow.isDestroyed.mockReturnValue(true);
    const replacementWindow = createSettingsWindow() as unknown as TestWindow;

    getWindowEventHandler(firstWindow, "closed")();
    expect(createSettingsWindow()).toBe(replacementWindow);

    replacementWindow.isDestroyed.mockReturnValue(true);
    closeSettingsWindow();

    expect(replacementWindow.close).not.toHaveBeenCalled();
    getWindowEventHandler(replacementWindow, "closed")();
  });

  it("uses the development route and macOS icon when applicable", () => {
    mocks.isDev = true;
    mocks.isMac = true;

    const settingsWindow = createSettingsWindow() as unknown as TestWindow;

    expect(mocks.devRoute).toHaveBeenCalledWith(ElectronWindowId.SETTINGS);
    expect(settingsWindow.loadURL).toHaveBeenCalledWith("http://localhost:3000/#/settings");
    expect(settingsWindow.loadFile).not.toHaveBeenCalled();
    expect(mocks.getAppIconPath).toHaveBeenCalledOnce();
    expect(mocks.getWindowIconPath).not.toHaveBeenCalled();
  });
});

function getWindowEventHandler(window: TestWindow, eventName: string): (...args: unknown[]) => void {
  const handler = window.events.get(eventName);

  if (!handler) {
    throw new Error(`Could not find the ${eventName} handler.`);
  }

  return handler;
}
