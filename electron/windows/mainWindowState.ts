/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, screen } from "electron";
import * as fs from "node:fs";
import { defaultMainWindowBounds } from "../../src/settings/defaultSettings";
import { AppWindowBounds } from "../../src/settings/AppWindowBounds";
import { AppWindowState } from "../../src/settings/AppWindowState";

export function saveMainWindowStateOnClose(window: BrowserWindow, mainWindowStateFilePath: string): void {
  const currentWindowState: AppWindowState = {
    bounds: window.isMaximized() || window.isFullScreen() ? window.getNormalBounds() : window.getBounds(),
    isMaximized: window.isMaximized()
  };

  fs.writeFileSync(mainWindowStateFilePath, `${JSON.stringify(currentWindowState, null, 2)}\n`);
}

export function readMainWindowState(mainWindowStateFilePath: string): AppWindowState {
  try {
    const content = fs.readFileSync(mainWindowStateFilePath, "utf-8");

    if (!content.trim()) {
      return getDefaultMainWindowState();
    }

    return JSON.parse(content) as AppWindowState;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return getDefaultMainWindowState();
    }

    console.warn("Failed to read main window state:", err);
    return getDefaultMainWindowState();
  }
}

export function getMainWindowLaunchBounds(windowState: AppWindowState): AppWindowBounds {
  return getVisibleMainWindowBounds(windowState.bounds);
}

function getDefaultMainWindowState(): AppWindowState {
  return {
    bounds: defaultMainWindowBounds,
    isMaximized: false
  };
}

function getVisibleMainWindowBounds(bounds: AppWindowBounds): AppWindowBounds {
  if (bounds.x === undefined || bounds.y === undefined || isWindowVisibleOnAnyDisplay(bounds)) {
    return bounds;
  }

  return {
    width: bounds.width,
    height: bounds.height
  };
}

function isWindowVisibleOnAnyDisplay(bounds: AppWindowBounds): boolean {
  return screen.getAllDisplays().some((display) => {
    const displayBounds = display.bounds;

    return bounds.x! < displayBounds.x + displayBounds.width
      && bounds.x! + bounds.width > displayBounds.x
      && bounds.y! < displayBounds.y + displayBounds.height
      && bounds.y! + bounds.height > displayBounds.y;
  });
}
