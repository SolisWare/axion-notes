/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, screen } from "electron";
import * as fs from "node:fs";
import { defaultMainWindowGridBounds, defaultMainWindowListBounds } from "../../src/settings/defaultSettings";
import { AppWindowBounds } from "../../src/settings/AppWindowBounds";
import { AppWindowState } from "../../src/settings/AppWindowState";
import { NoteLayoutPreference } from "../../src/settings/NoteLayoutPreference";

export function saveMainWindowStateOnClose(window: BrowserWindow, mainWindowStateFilePath: string): void {
  if (!window.isResizable()) {
    saveMainWindowPositionState(window, mainWindowStateFilePath);
    return;
  }

  saveMainWindowGridState(window, mainWindowStateFilePath);
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

export function getMainWindowLaunchBounds(windowState: AppWindowState, layout: NoteLayoutPreference): AppWindowBounds {
  return getVisibleMainWindowBounds(getMainWindowBoundsForLayout(windowState.bounds, layout));
}

export function applyMainWindowLayout(window: BrowserWindow, mainWindowStateFilePath: string, layout: NoteLayoutPreference): void {
  if (layout === NoteLayoutPreference.LIST) {
    if (window.isResizable()) {
      saveMainWindowGridState(window, mainWindowStateFilePath);
    }

    if (window.isMaximized()) {
      window.unmaximize();
    }

    window.setBounds(getVisibleMainWindowBounds(getMainWindowBoundsForLayout(window.getBounds(), layout)));
    window.setResizable(false);
    window.setMaximizable(false);
    return;
  }

  const mainWindowState = readMainWindowState(mainWindowStateFilePath);

  window.setResizable(true);
  window.setMaximizable(true);
  window.setBounds(getVisibleMainWindowBounds(mainWindowState.bounds));

  if (mainWindowState.isMaximized) {
    window.maximize();
  }
}

function getDefaultMainWindowState(): AppWindowState {
  return {
    bounds: defaultMainWindowGridBounds,
    isMaximized: false
  };
}

function saveMainWindowGridState(window: BrowserWindow, mainWindowStateFilePath: string): void {
  const currentWindowState: AppWindowState = {
    bounds: window.isMaximized() || window.isFullScreen() ? window.getNormalBounds() : window.getBounds(),
    isMaximized: window.isMaximized()
  };

  fs.writeFileSync(mainWindowStateFilePath, `${JSON.stringify(currentWindowState, null, 2)}\n`);
}

function saveMainWindowPositionState(window: BrowserWindow, mainWindowStateFilePath: string): void {
  const currentWindowState = readMainWindowState(mainWindowStateFilePath);
  const currentBounds = window.getBounds();

  const updatedWindowState: AppWindowState = {
    ...currentWindowState,
    bounds: {
      ...currentWindowState.bounds,
      x: currentBounds.x,
      y: currentBounds.y
    }
  };

  fs.writeFileSync(mainWindowStateFilePath, `${JSON.stringify(updatedWindowState, null, 2)}\n`);
}

function getMainWindowBoundsForLayout(currentBounds: AppWindowBounds, layout: NoteLayoutPreference): AppWindowBounds {
  if (layout === NoteLayoutPreference.LIST) {
    return {
      ...currentBounds,
      width: defaultMainWindowListBounds.width,
      height: defaultMainWindowListBounds.height
    };
  }

  return currentBounds;
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
