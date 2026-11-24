/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { BrowserWindow } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("blocks untrusted, unsafe, and malformed navigation without allowing an unsafe external launch", () => {
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

function createWindow(): BrowserWindow & {
  webContents: {
    on: ReturnType<typeof vi.fn>;
    setWindowOpenHandler: ReturnType<typeof vi.fn>;
  };
} {
  return {
    webContents: {
      on: vi.fn(),
      setWindowOpenHandler: vi.fn()
    }
  } as unknown as BrowserWindow & {
    webContents: {
      on: ReturnType<typeof vi.fn>;
      setWindowOpenHandler: ReturnType<typeof vi.fn>;
    };
  };
}

function getWillNavigateHandler(window: ReturnType<typeof createWindow>): (event: { preventDefault: ReturnType<typeof vi.fn> }, url: string) => void {
  const registration = window.webContents.on.mock.calls.find(([eventName]) => eventName === "will-navigate");

  if (!registration) {
    throw new Error("Could not find the will-navigate handler.");
  }

  return registration[1] as (event: { preventDefault: ReturnType<typeof vi.fn> }, url: string) => void;
}

function createNavigationEvent(): { preventDefault: ReturnType<typeof vi.fn> } {
  return { preventDefault: vi.fn() };
}
