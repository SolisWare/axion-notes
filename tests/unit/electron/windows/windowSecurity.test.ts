/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { BrowserWindow } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAppIndexFilePath, getAppWindowWebPreferences, registerWindowNavigationGuards } from "../../../../electron/windows/windowSecurity";

const mocks = vi.hoisted(() => ({
  devToolsPreferences: { devTools: false },
  isDev: false,
  openExternal: vi.fn()
}));

vi.mock("electron", () => ({
  shell: {
    openExternal: mocks.openExternal
  }
}));

vi.mock("../../../../electron/utils/devTools", () => ({
  getDevToolsWebPreferences: () => mocks.devToolsPreferences
}));

vi.mock("../../../../electron/utils/isDev", () => ({
  get isDev() {
    return mocks.isDev;
  }
}));

beforeEach(() => {
  mocks.devToolsPreferences = { devTools: false };
  mocks.isDev = false;
  mocks.openExternal.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("windowSecurity", () => {
  it("returns hardened web preferences while retaining the environment-specific DevTools setting", () => {
    mocks.devToolsPreferences = { devTools: true };

    expect(getAppWindowWebPreferences("/app/preload.js")).toEqual({
      allowRunningInsecureContent: false,
      contextIsolation: true,
      devTools: true,
      nodeIntegration: false,
      preload: "/app/preload.js",
      sandbox: false,
      webSecurity: true
    });
  });

  it("resolves the packaged application index file", () => {
    expect(getAppIndexFilePath()).toBe(path.join(process.cwd(), "index.html"));
  });

  it("allows only the explicitly registered application file while denying every popup", async () => {
    const window = createWindow();
    const allowedFilePath = path.join(process.cwd(), "index.html");
    registerWindowNavigationGuards(window, {
      allowedFilePaths: [path.join(process.cwd(), "other.html"), allowedFilePath]
    });

    const openHandler = window.webContents.setWindowOpenHandler.mock.calls[0][0];
    const willNavigate = getWillNavigateHandler(window);
    const allowedNavigation = createNavigationEvent();

    expect(openHandler({ url: "mailto:hello@example.com" })).toEqual({ action: "deny" });
    expect(mocks.openExternal).toHaveBeenCalledWith("mailto:hello@example.com");

    willNavigate(allowedNavigation, pathToFileURL(allowedFilePath).toString());

    expect(allowedNavigation.preventDefault).not.toHaveBeenCalled();
    expect(mocks.openExternal).toHaveBeenCalledTimes(1);

    await Promise.resolve();
  });

  it("blocks untrusted, unsafe, and malformed navigation without allowing an unsafe external launch", async () => {
    const window = createWindow();
    registerWindowNavigationGuards(window);
    const willNavigate = getWillNavigateHandler(window);

    const remoteNavigation = createNavigationEvent();
    willNavigate(remoteNavigation, "https://example.com/path");
    expect(remoteNavigation.preventDefault).toHaveBeenCalledOnce();
    expect(mocks.openExternal).toHaveBeenCalledWith("https://example.com/path");

    const unsafeNavigation = createNavigationEvent();
    willNavigate(unsafeNavigation, "javascript:alert('unsafe')");
    expect(unsafeNavigation.preventDefault).toHaveBeenCalledOnce();
    expect(mocks.openExternal).toHaveBeenCalledTimes(1);

    const malformedNavigation = createNavigationEvent();
    willNavigate(malformedNavigation, "not a valid URL");
    expect(malformedNavigation.preventDefault).toHaveBeenCalledOnce();
    expect(mocks.openExternal).toHaveBeenCalledTimes(1);

    const untrustedFileNavigation = createNavigationEvent();
    willNavigate(untrustedFileNavigation, pathToFileURL(path.join(process.cwd(), "untrusted.html")).toString());
    expect(untrustedFileNavigation.preventDefault).toHaveBeenCalledOnce();
    expect(mocks.openExternal).toHaveBeenCalledTimes(1);

    await Promise.resolve();
  });

  it("restores the last allowed app URL if Electron leaves a rejected navigation on a blank document", async () => {
    vi.useFakeTimers();
    const allowedUrl = pathToFileURL(path.join(process.cwd(), "index.html")).toString();
    const window = createWindow(allowedUrl);
    registerWindowNavigationGuards(window, { allowedFilePaths: [path.join(process.cwd(), "index.html")] });

    window.webContents.getURL.mockReturnValue("");
    getWillNavigateHandler(window)(createNavigationEvent(), "https://example.com/navigation");
    await vi.advanceTimersByTimeAsync(50);

    expect(window.webContents.loadURL).toHaveBeenCalledWith(allowedUrl);
  });

  it("keeps the latest allowed URL through navigation lifecycle events before restoring it", async () => {
    vi.useFakeTimers();
    const firstAllowedUrl = pathToFileURL(path.join(process.cwd(), "index.html")).toString();
    const secondAllowedUrl = `${firstAllowedUrl}#/main`;
    const thirdAllowedUrl = `${firstAllowedUrl}#/main/lock`;
    const window = createWindow(firstAllowedUrl);
    registerWindowNavigationGuards(window, { allowedFilePaths: [path.join(process.cwd(), "index.html")] });

    getWebContentsHandler(window, "did-navigate")({}, secondAllowedUrl);
    getWebContentsHandler(window, "did-navigate")({}, "https://example.com/untrusted");
    getWebContentsHandler(window, "did-navigate-in-page")({}, thirdAllowedUrl);
    getWebContentsHandler(window, "did-navigate-in-page")({}, "https://example.com/untrusted");
    window.webContents.getURL.mockReturnValue("");
    getWebContentsHandler(window, "did-finish-load")({});
    getWillNavigateHandler(window)(createNavigationEvent(), "https://example.com/navigation");
    await vi.advanceTimersByTimeAsync(50);

    expect(window.webContents.loadURL).toHaveBeenCalledWith(thirdAllowedUrl);
  });

  it("reports a failed app-route restoration without throwing from the navigation guard", async () => {
    vi.useFakeTimers();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const allowedUrl = pathToFileURL(path.join(process.cwd(), "index.html")).toString();
    const window = createWindow(allowedUrl);
    registerWindowNavigationGuards(window, { allowedFilePaths: [path.join(process.cwd(), "index.html")] });
    window.webContents.getURL.mockReturnValue("");
    window.webContents.loadURL.mockRejectedValue(new Error("unavailable"));

    getWillNavigateHandler(window)(createNavigationEvent(), "https://example.com/navigation");
    await vi.advanceTimersByTimeAsync(50);
    await Promise.resolve();

    expect(warning).toHaveBeenCalledWith("Failed to restore the previous app navigation:", expect.any(Error));
  });

  it("allows the configured development-server origin but not other local origins", () => {
    mocks.isDev = true;
    const window = createWindow();
    registerWindowNavigationGuards(window);
    const willNavigate = getWillNavigateHandler(window);

    const developmentNavigation = createNavigationEvent();
    willNavigate(developmentNavigation, "http://localhost:3000/#/main");
    expect(developmentNavigation.preventDefault).not.toHaveBeenCalled();

    const otherLocalNavigation = createNavigationEvent();
    willNavigate(otherLocalNavigation, "http://localhost:3001/#/main");
    expect(otherLocalNavigation.preventDefault).toHaveBeenCalledOnce();
    expect(mocks.openExternal).toHaveBeenCalledWith("http://localhost:3001/#/main");
  });

  it("does not fail navigation handling when opening a safe external URL is rejected", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.openExternal.mockRejectedValue(new Error("unavailable"));
    const window = createWindow();
    registerWindowNavigationGuards(window);

    getWillNavigateHandler(window)(createNavigationEvent(), "https://example.com");
    await vi.waitFor(() => expect(warning).toHaveBeenCalledWith("Failed to open external URL:", expect.any(Error)));
  });
});

function createWindow(currentUrl = ""): BrowserWindow & {
  webContents: {
    getURL: ReturnType<typeof vi.fn>;
    loadURL: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    setWindowOpenHandler: ReturnType<typeof vi.fn>;
  };
} {
  return {
    webContents: {
      getURL: vi.fn(() => currentUrl),
      loadURL: vi.fn(async () => undefined),
      on: vi.fn(),
      setWindowOpenHandler: vi.fn()
    }
  } as unknown as BrowserWindow & {
    webContents: {
      getURL: ReturnType<typeof vi.fn>;
      loadURL: ReturnType<typeof vi.fn>;
      on: ReturnType<typeof vi.fn>;
      setWindowOpenHandler: ReturnType<typeof vi.fn>;
    };
  };
}

function getWillNavigateHandler(window: ReturnType<typeof createWindow>): (event: { preventDefault: ReturnType<typeof vi.fn> }, url: string) => void {
  return getWebContentsHandler(window, "will-navigate") as (event: { preventDefault: ReturnType<typeof vi.fn> }, url: string) => void;
}

function getWebContentsHandler(window: ReturnType<typeof createWindow>, eventName: string): (...args: unknown[]) => void {
  const registration = window.webContents.on.mock.calls.find(([registeredEventName]) => registeredEventName === eventName);

  if (!registration) {
    throw new Error(`Could not find the ${eventName} handler.`);
  }

  return registration[1] as (...args: unknown[]) => void;
}

function createNavigationEvent(): { preventDefault: ReturnType<typeof vi.fn> } {
  return { preventDefault: vi.fn() };
}
