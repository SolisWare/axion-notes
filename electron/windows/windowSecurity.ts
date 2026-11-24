/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, WebPreferences, shell } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
import { isDev } from "../utils/isDev";
import { getDevToolsWebPreferences } from "../utils/devTools";

const DEV_SERVER_ORIGIN = "http://localhost:3000";
const NAVIGATION_RESTORE_DELAY_MS = 50;
const SAFE_EXTERNAL_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

type NavigationGuardOptions = {
  allowedFilePaths?: string[];
};

export function getAppWindowWebPreferences(preload: string): WebPreferences {
  return {
    ...getDevToolsWebPreferences(),
    allowRunningInsecureContent: false,
    contextIsolation: true,
    nodeIntegration: false,
    preload,
    sandbox: false,
    webSecurity: true
  };
}

export function getAppIndexFilePath(): string {
  return path.join(__dirname, "../../index.html");
}

export function registerWindowNavigationGuards(window: BrowserWindow, options: NavigationGuardOptions = {}): void {
  let lastAllowedNavigationUrl = getAllowedNavigationUrl(window.webContents.getURL(), options);

  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrlIfSafe(url);

    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isAllowedAppNavigation(url, options)) {
      lastAllowedNavigationUrl = url;
      return;
    }

    event.preventDefault();
    openExternalUrlIfSafe(url);
    restoreAllowedNavigationIfNeeded(window, options, lastAllowedNavigationUrl);
  });

  window.webContents.on("did-navigate", (_event, url) => {
    lastAllowedNavigationUrl = getAllowedNavigationUrl(url, options) ?? lastAllowedNavigationUrl;
  });

  window.webContents.on("did-navigate-in-page", (_event, url) => {
    lastAllowedNavigationUrl = getAllowedNavigationUrl(url, options) ?? lastAllowedNavigationUrl;
  });

  window.webContents.on("did-finish-load", () => {
    lastAllowedNavigationUrl = getAllowedNavigationUrl(window.webContents.getURL(), options) ?? lastAllowedNavigationUrl;
  });
}

function isAllowedAppNavigation(url: string, options: NavigationGuardOptions): boolean {
  try {
    const parsedUrl = new URL(url);

    if (isDev && parsedUrl.origin === DEV_SERVER_ORIGIN) {
      return true;
    }

    if (parsedUrl.protocol !== "file:") {
      return false;
    }

    const filePath = path.normalize(fileURLToPath(parsedUrl));

    return (options.allowedFilePaths ?? []).some((allowedFilePath) => {
      return filePath === path.normalize(allowedFilePath);
    });
  } catch {
    return false;
  }
}

function getAllowedNavigationUrl(url: string, options: NavigationGuardOptions): string | undefined {
  return isAllowedAppNavigation(url, options) ? url : undefined;
}

function restoreAllowedNavigationIfNeeded(window: BrowserWindow, options: NavigationGuardOptions, lastAllowedNavigationUrl: string | undefined): void {
  setTimeout(() => {
    if (!lastAllowedNavigationUrl || isAllowedAppNavigation(window.webContents.getURL(), options)) {
      return;
    }

    window.webContents.loadURL(lastAllowedNavigationUrl).catch((err) => {
      console.warn("Failed to restore the previous app navigation:", err);
    });
  }, NAVIGATION_RESTORE_DELAY_MS);
}

function openExternalUrlIfSafe(url: string): void {
  try {
    const parsedUrl = new URL(url);

    if (!SAFE_EXTERNAL_PROTOCOLS.has(parsedUrl.protocol)) {
      return;
    }

    shell.openExternal(url).catch((err) => {
      console.warn("Failed to open external URL:", err);
    });
  } catch {
    // Ignore malformed URLs.
  }
}
