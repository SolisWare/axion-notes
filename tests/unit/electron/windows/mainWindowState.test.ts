/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { BrowserWindow } from "electron";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppWindowState } from "../../../../src/settings/AppWindowState";
import { NoteLayoutPreference } from "../../../../src/settings/NoteLayoutPreference";
import { getMainWindowLaunchBounds, readMainWindowState, saveMainWindowStateOnClose, suppressMainWindowStateSaveOnClose } from "../../../../electron/windows/mainWindowState";

const temporaryDirectories: string[] = [];

vi.mock("electron", () => ({
  screen: {
    getAllDisplays: () => [{ bounds: { height: 1_080, width: 1_920, x: 0, y: 0 } }]
  }
}));

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("mainWindowState", () => {
  it("saves current normal bounds and position for the next normal launch", async () => {
    const stateFilePath = await writeMainWindowState({
      bounds: { height: 500, width: 700, x: 10, y: 20 },
      isMaximized: false
    });
    const currentBounds = { height: 740, width: 1180, x: 222, y: 111 };
    const window = createWindow(currentBounds, false);

    saveMainWindowStateOnClose(window, stateFilePath);

    const savedState = readMainWindowState(stateFilePath);
    expect(savedState).toEqual({ bounds: currentBounds, isMaximized: false });
    expect(getMainWindowLaunchBounds(savedState, NoteLayoutPreference.GRID)).toEqual(currentBounds);
  });

  it("retains restored normal bounds and position when the pre-restore window closes", async () => {
    const restoredState: AppWindowState = {
      bounds: { height: 740, width: 1180, x: 222, y: 111 },
      isMaximized: false
    };
    const stateFilePath = await writeMainWindowState(restoredState);
    const window = createWindow({ height: 500, width: 700, x: 10, y: 20 }, false);

    suppressMainWindowStateSaveOnClose(window);
    saveMainWindowStateOnClose(window, stateFilePath);

    expect(readMainWindowState(stateFilePath)).toEqual(restoredState);
  });

  it("retains restored normal bounds and maximized state when the pre-restore window closes", async () => {
    const restoredState: AppWindowState = {
      bounds: { height: 880, width: 1440, x: 120, y: 80 },
      isMaximized: true
    };
    const stateFilePath = await writeMainWindowState(restoredState);
    const window = createWindow({ height: 600, width: 900, x: 5, y: 15 }, true);

    suppressMainWindowStateSaveOnClose(window);
    saveMainWindowStateOnClose(window, stateFilePath);

    expect(readMainWindowState(stateFilePath)).toEqual(restoredState);
  });
});

function createWindow(bounds: AppWindowState["bounds"], isMaximized: boolean): BrowserWindow {
  return {
    getBounds: () => bounds,
    getNormalBounds: () => bounds,
    isFullScreen: () => false,
    isMaximized: () => isMaximized,
    isResizable: () => true
  } as unknown as BrowserWindow;
}

async function writeMainWindowState(state: AppWindowState): Promise<string> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-main-window-state-"));
  const stateFilePath = path.join(directory, "main-window-state.json");
  temporaryDirectories.push(directory);
  await fs.promises.writeFile(stateFilePath, JSON.stringify(state), "utf-8");
  return stateFilePath;
}
