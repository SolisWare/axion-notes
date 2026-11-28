/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindowConstructorOptions } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { createMainWindow } from "../../../../electron/windows/createMainWindow";
import { NoteLayoutPreference } from "../../../../src/settings/NoteLayoutPreference";
import { ElectronWindowId } from "../../../../src/types/ElectronWindowId";

type TestWindow = {
  close: ReturnType<typeof vi.fn>;
  events: Map<string, (...args: never[]) => void>;
  isDestroyed: ReturnType<typeof vi.fn>;
  loadFile: ReturnType<typeof vi.fn>;
  loadURL: ReturnType<typeof vi.fn>;
  maximize: ReturnType<typeof vi.fn>;
  options: BrowserWindowConstructorOptions;
  show: ReturnType<typeof vi.fn>;
  webContents: {
    openDevTools: ReturnType<typeof vi.fn>;
  };
};

const mocks = vi.hoisted(() => ({
  blockProductionDevTools: vi.fn(),
  devRoute: vi.fn(),
  getAppIconPath: vi.fn(() => "/app/icon.png"),
  getAppIndexFilePath: vi.fn(() => "/app/index.html"),
  getAppWindowWebPreferences: vi.fn(() => ({ preload: "/app/preload.js" })),
  getMainWindowLaunchBounds: vi.fn(() => ({ height: 600, width: 700, x: 100, y: 200 })),
  isDev: false,
  isMac: false,
  ipcHandlers: new Map<string, (...args: never[]) => void>(),
  lockStateService: {
    getIsLocked: vi.fn(() => false),
    registerMainWindow: vi.fn()
  },
  productionRoute: vi.fn(),
  readMainWindowState: vi.fn(() => ({
    bounds: { height: 600, width: 700, x: 100, y: 200 },
    isMaximized: false
  })),
  registerRichTextShortcuts: vi.fn(),
  registerWindowNavigationGuards: vi.fn(),
  saveMainWindowStateOnClose: vi.fn(),
  windows: [] as TestWindow[]
}));

vi.mock("electron", () => {
  class BrowserWindow {
    readonly close = vi.fn();
    readonly events = new Map<string, (...args: never[]) => void>();
    readonly isDestroyed = vi.fn(() => false);
    readonly loadFile = vi.fn();
    readonly loadURL = vi.fn();
    readonly maximize = vi.fn();
    readonly show = vi.fn();
    readonly webContents = { openDevTools: vi.fn() };
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

  return {
    BrowserWindow,
    ipcMain: {
      on: vi.fn((channel: string, listener: (...args: never[]) => void) => mocks.ipcHandlers.set(channel, listener)),
      removeListener: vi.fn((channel: string) => mocks.ipcHandlers.delete(channel))
    }
  };
});

vi.mock("../../../../electron/utils/appIcon", () => ({
  getAppIconPath: mocks.getAppIconPath,
  getWindowIconPath: vi.fn(() => "/window/icon.png")
}));

vi.mock("../../../../electron/utils/devTools", () => ({
  blockProductionDevTools: mocks.blockProductionDevTools
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

vi.mock("../../../../electron/utils/richTextShortcuts", () => ({
  registerRichTextShortcuts: mocks.registerRichTextShortcuts
}));

vi.mock("../../../../electron/windows/mainWindowState", () => ({
  getMainWindowLaunchBounds: mocks.getMainWindowLaunchBounds,
  readMainWindowState: mocks.readMainWindowState,
  saveMainWindowStateOnClose: mocks.saveMainWindowStateOnClose
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
  mocks.devRoute.mockReturnValue("http://127.0.0.1:3000/#/main");
  mocks.getAppIconPath.mockClear();
  mocks.getAppIndexFilePath.mockClear();
  mocks.getAppWindowWebPreferences.mockClear();
  mocks.getMainWindowLaunchBounds.mockClear();
  mocks.getMainWindowLaunchBounds.mockReturnValue({ height: 600, width: 700, x: 100, y: 200 });
  mocks.isDev = false;
  mocks.isMac = false;
  mocks.ipcHandlers.clear();
  mocks.lockStateService.getIsLocked.mockReset();
  mocks.lockStateService.getIsLocked.mockReturnValue(false);
  mocks.lockStateService.registerMainWindow.mockClear();
  mocks.productionRoute.mockReset();
  mocks.productionRoute.mockReturnValue(["/app/index.html", { hash: "/main" }]);
  mocks.readMainWindowState.mockReset();
  mocks.readMainWindowState.mockReturnValue({
    bounds: { height: 600, width: 700, x: 100, y: 200 },
    isMaximized: false
  });
  mocks.registerRichTextShortcuts.mockClear();
  mocks.registerWindowNavigationGuards.mockClear();
  mocks.saveMainWindowStateOnClose.mockClear();
  mocks.windows.splice(0);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createMainWindow", () => {
  it("creates the hardened production grid window from saved state", () => {
    const mainWindow = createMainWindow(createOptions()) as unknown as TestWindow;

    expect(mocks.readMainWindowState).toHaveBeenCalledWith("/app/main-window.json");
    expect(mocks.getMainWindowLaunchBounds).toHaveBeenCalledWith(expect.any(Object), NoteLayoutPreference.GRID);
    expect(mainWindow.options).toMatchObject({
      height: 600,
      icon: "/window/icon.png",
      maximizable: true,
      minHeight: 250,
      minWidth: 335,
      resizable: true,
      show: false,
      width: 700,
      webPreferences: { preload: "/app/preload.js" },
      x: 100,
      y: 200
    });
    expect(mocks.registerRichTextShortcuts).toHaveBeenCalledWith(mainWindow);
    expect(mocks.blockProductionDevTools).toHaveBeenCalledWith(mainWindow);
    expect(mocks.registerWindowNavigationGuards).toHaveBeenCalledWith(mainWindow, { allowedFilePaths: ["/app/index.html"] });
    expect(mocks.lockStateService.registerMainWindow).toHaveBeenCalledWith(mainWindow);
    expect(mocks.productionRoute).toHaveBeenCalledWith(ElectronWindowId.MAIN, "");
    expect(mainWindow.loadFile).toHaveBeenCalledWith("/app/index.html", { hash: "/main" });
  });

  it("uses a fixed non-maximizable list window even when saved grid state is maximized", () => {
    mocks.readMainWindowState.mockReturnValue({
      bounds: { height: 600, width: 700 },
      isMaximized: true
    });

    const mainWindow = createMainWindow(createOptions({ initialNoteLayout: NoteLayoutPreference.LIST })) as unknown as TestWindow;

    expect(mainWindow.options).toMatchObject({ maximizable: false, resizable: false });
    expect(mainWindow.maximize).not.toHaveBeenCalled();
  });

  it("restores maximized grid state", () => {
    mocks.readMainWindowState.mockReturnValue({
      bounds: { height: 600, width: 700 },
      isMaximized: true
    });

    const mainWindow = createMainWindow(createOptions()) as unknown as TestWindow;

    expect(mainWindow.maximize).toHaveBeenCalledOnce();
  });

  it("uses the locked route when the main lock state is active", () => {
    mocks.lockStateService.getIsLocked.mockReturnValue(true);

    createMainWindow(createOptions());

    expect(mocks.productionRoute).toHaveBeenCalledWith(ElectronWindowId.MAIN, "/lock");
  });

  it("shows and closes the splash only when its own renderer reports ready", () => {
    vi.useFakeTimers();
    const splashWindow = createSplashWindow();
    const mainWindow = createMainWindow(createOptions({ splashWindow })) as unknown as TestWindow;
    getWindowEventHandler(mainWindow, "ready-to-show")();
    const readyHandler = mocks.ipcHandlers.get(channels.appWindow.readyToShow);

    readyHandler?.({ sender: {} } as never);
    expect(mainWindow.show).not.toHaveBeenCalled();

    readyHandler?.({ sender: mainWindow.webContents } as never);
    expect(mainWindow.show).toHaveBeenCalledOnce();
    expect(splashWindow.close).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(10_000);
    expect(mainWindow.show).toHaveBeenCalledOnce();
  });

  it("uses the ready-to-show fallback if the renderer never signals readiness", () => {
    vi.useFakeTimers();
    const splashWindow = createSplashWindow();
    const mainWindow = createMainWindow(createOptions({ splashWindow })) as unknown as TestWindow;

    getWindowEventHandler(mainWindow, "ready-to-show")();
    vi.advanceTimersByTime(9_999);
    expect(mainWindow.show).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mainWindow.show).toHaveBeenCalledOnce();
    expect(splashWindow.close).toHaveBeenCalledOnce();
  });

  it("shows immediately without a splash when its renderer is ready before Electron emits ready-to-show", () => {
    const mainWindow = createMainWindow(createOptions()) as unknown as TestWindow;
    const readyHandler = mocks.ipcHandlers.get(channels.appWindow.readyToShow);

    readyHandler?.({ sender: mainWindow.webContents } as never);
    getWindowEventHandler(mainWindow, "closed")();

    expect(mainWindow.show).toHaveBeenCalledOnce();
    expect(mocks.ipcHandlers.has(channels.appWindow.readyToShow)).toBe(false);
  });

  it("does not show a destroyed main window or close a destroyed splash window", () => {
    vi.useFakeTimers();
    const splashWindow = createSplashWindow();
    splashWindow.isDestroyed.mockReturnValue(true);
    const mainWindow = createMainWindow(createOptions({ splashWindow })) as unknown as TestWindow;
    mainWindow.isDestroyed.mockReturnValue(true);

    getWindowEventHandler(mainWindow, "ready-to-show")();
    vi.advanceTimersByTime(10_000);

    expect(mainWindow.show).not.toHaveBeenCalled();
    expect(splashWindow.close).not.toHaveBeenCalled();
  });

  it("persists state on close and removes the IPC listener and fallback timer after close", () => {
    vi.useFakeTimers();
    const mainWindow = createMainWindow(createOptions()) as unknown as TestWindow;
    getWindowEventHandler(mainWindow, "ready-to-show")();

    getWindowEventHandler(mainWindow, "close")();
    getWindowEventHandler(mainWindow, "closed")();
    vi.advanceTimersByTime(10_000);

    expect(mocks.saveMainWindowStateOnClose).toHaveBeenCalledWith(mainWindow, "/app/main-window.json");
    expect(mainWindow.show).not.toHaveBeenCalled();
    expect(mocks.ipcHandlers.has(channels.appWindow.readyToShow)).toBe(false);
  });

  it("loads the development route, opens detached DevTools, and uses the macOS app icon", () => {
    mocks.isDev = true;
    mocks.isMac = true;
    mocks.lockStateService.getIsLocked.mockReturnValue(true);

    const mainWindow = createMainWindow(createOptions()) as unknown as TestWindow;

    expect(mocks.devRoute).toHaveBeenCalledWith(ElectronWindowId.MAIN, "/lock");
    expect(mainWindow.loadURL).toHaveBeenCalledWith("http://127.0.0.1:3000/#/main");
    expect(mainWindow.loadFile).not.toHaveBeenCalled();
    expect(mainWindow.webContents.openDevTools).toHaveBeenCalledWith({ mode: "detach" });
    expect(mocks.getAppIconPath).toHaveBeenCalledOnce();
  });

  it("uses the normal development route when the app is unlocked", () => {
    mocks.isDev = true;

    createMainWindow(createOptions());

    expect(mocks.devRoute).toHaveBeenCalledWith(ElectronWindowId.MAIN, "");
  });
});

function createOptions(overrides: Partial<{
  initialNoteLayout: NoteLayoutPreference;
  splashWindow: TestWindow;
}> = {}) {
  return {
    initialNoteLayout: overrides.initialNoteLayout ?? NoteLayoutPreference.GRID,
    lockStateService: mocks.lockStateService as never,
    mainWindowStateFilePath: "/app/main-window.json",
    ...(overrides.splashWindow ? { splashWindow: overrides.splashWindow as never } : {})
  };
}

function createSplashWindow(): TestWindow {
  return {
    close: vi.fn(),
    events: new Map(),
    isDestroyed: vi.fn(() => false),
    loadFile: vi.fn(),
    loadURL: vi.fn(),
    maximize: vi.fn(),
    options: {},
    show: vi.fn(),
    webContents: { openDevTools: vi.fn() }
  };
}

function getWindowEventHandler(window: TestWindow, eventName: string): (...args: never[]) => void {
  const handler = window.events.get(eventName);

  if (!handler) {
    throw new Error(`Could not find the ${eventName} handler.`);
  }

  return handler;
}
