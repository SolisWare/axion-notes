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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultMainWindowGridBounds, defaultMainWindowListBounds } from "../../../../src/settings/defaultSettings";
import { AppWindowState } from "../../../../src/settings/AppWindowState";
import { NoteLayoutPreference } from "../../../../src/settings/NoteLayoutPreference";
import {
  applyMainWindowLayout,
  getMainWindowLaunchBounds,
  readMainWindowState,
  replaceMainWindowState,
  saveMainWindowStateOnClose,
  suppressMainWindowStateSaveOnClose
} from "../../../../electron/windows/mainWindowState";

const temporaryDirectories: string[] = [];
const electronMocks = vi.hoisted(() => ({
  getAllDisplays: vi.fn()
}));

vi.mock("electron", () => ({
  screen: {
    getAllDisplays: electronMocks.getAllDisplays
  }
}));

beforeEach(() => {
  electronMocks.getAllDisplays.mockReturnValue([{ bounds: { height: 1_080, width: 1_920, x: 0, y: 0 } }]);
});

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("mainWindowState", () => {
  it("uses the default grid state when no saved state exists, is empty, or is invalid", async () => {
    const directory = await createTemporaryDirectory();
    const stateFilePath = path.join(directory, "main-window-state.json");
    const defaultState = { bounds: defaultMainWindowGridBounds, isMaximized: false };

    expect(readMainWindowState(stateFilePath)).toEqual(defaultState);

    await fs.promises.writeFile(stateFilePath, "   \n", "utf-8");
    expect(readMainWindowState(stateFilePath)).toEqual(defaultState);

    await fs.promises.writeFile(stateFilePath, "not json", "utf-8");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(readMainWindowState(stateFilePath)).toEqual(defaultState);
    expect(warning).toHaveBeenCalledWith("Failed to read main window state:", expect.any(SyntaxError));
    warning.mockRestore();
  });

  it("replaces a saved state atomically and creates its parent directory", async () => {
    const directory = await createTemporaryDirectory();
    const stateFilePath = path.join(directory, "nested", "main-window-state.json");
    const state: AppWindowState = {
      bounds: { height: 740, width: 1180, x: 222, y: 111 },
      isMaximized: true
    };

    await replaceMainWindowState(stateFilePath, state);

    await expect(fs.promises.readFile(stateFilePath, "utf-8")).resolves.toBe(`${JSON.stringify(state, null, 2)}\n`);
    await expect(fs.promises.access(`${stateFilePath}.tmp`)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("uses grid bounds unchanged when they are visible and list dimensions for the list layout", () => {
    const state: AppWindowState = {
      bounds: { height: 740, width: 1180, x: 222, y: 111 },
      isMaximized: false
    };

    expect(getMainWindowLaunchBounds(state, NoteLayoutPreference.GRID)).toEqual(state.bounds);
    expect(getMainWindowLaunchBounds(state, NoteLayoutPreference.LIST)).toEqual({
      height: defaultMainWindowListBounds.height,
      width: defaultMainWindowListBounds.width,
      x: state.bounds.x,
      y: state.bounds.y
    });
  });

  it("drops an off-screen position while preserving the saved dimensions", () => {
    const bounds = getMainWindowLaunchBounds({
      bounds: { height: 740, width: 1180, x: 3_000, y: 2_000 },
      isMaximized: false
    }, NoteLayoutPreference.GRID);

    expect(bounds).toEqual({ height: 740, width: 1180 });
  });

  it("keeps a position that overlaps any connected display", () => {
    electronMocks.getAllDisplays.mockReturnValue([
      { bounds: { height: 1_080, width: 1_920, x: 0, y: 0 } },
      { bounds: { height: 1_080, width: 1_920, x: 1_920, y: 0 } }
    ]);
    const state: AppWindowState = {
      bounds: { height: 740, width: 1180, x: 1_950, y: 111 },
      isMaximized: false
    };

    expect(getMainWindowLaunchBounds(state, NoteLayoutPreference.GRID)).toEqual(state.bounds);
  });

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

  it("saves normal bounds and the maximized state when the grid window is maximized", async () => {
    const stateFilePath = await writeMainWindowState({
      bounds: { height: 500, width: 700, x: 10, y: 20 },
      isMaximized: false
    });
    const normalBounds = { height: 740, width: 1180, x: 222, y: 111 };
    const window = createWindow({ height: 1_080, width: 1_920, x: 0, y: 0 }, { isMaximized: true, normalBounds });

    saveMainWindowStateOnClose(window, stateFilePath);

    expect(readMainWindowState(stateFilePath)).toEqual({ bounds: normalBounds, isMaximized: true });
  });

  it("saves normal bounds without marking the window maximized when it closes from full screen", async () => {
    const stateFilePath = await writeMainWindowState({
      bounds: { height: 500, width: 700, x: 10, y: 20 },
      isMaximized: true
    });
    const normalBounds = { height: 740, width: 1180, x: 222, y: 111 };
    const window = createWindow({ height: 1_080, width: 1_920, x: 0, y: 0 }, { isFullScreen: true, normalBounds });

    saveMainWindowStateOnClose(window, stateFilePath);

    expect(readMainWindowState(stateFilePath)).toEqual({ bounds: normalBounds, isMaximized: false });
  });

  it("preserves list dimensions and maximized state while saving a non-resizable list window position", async () => {
    const stateFilePath = await writeMainWindowState({
      bounds: { height: 800, width: 480, x: 10, y: 20 },
      isMaximized: true
    });
    const window = createWindow({ height: 800, width: 480, x: 222, y: 111 }, { isResizable: false });

    saveMainWindowStateOnClose(window, stateFilePath);

    expect(readMainWindowState(stateFilePath)).toEqual({
      bounds: { height: 800, width: 480, x: 222, y: 111 },
      isMaximized: true
    });
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

  it("suppresses only the next close so later ordinary closes still persist state", async () => {
    const stateFilePath = await writeMainWindowState({
      bounds: { height: 740, width: 1180, x: 222, y: 111 },
      isMaximized: false
    });
    const updatedBounds = { height: 650, width: 900, x: 33, y: 44 };
    const window = createWindow(updatedBounds, {});

    suppressMainWindowStateSaveOnClose(window);
    saveMainWindowStateOnClose(window, stateFilePath);
    saveMainWindowStateOnClose(window, stateFilePath);

    expect(readMainWindowState(stateFilePath)).toEqual({ bounds: updatedBounds, isMaximized: false });
  });

  it("switches to list layout after preserving grid state and disables grid-only window controls", async () => {
    const stateFilePath = await writeMainWindowState({
      bounds: { height: 500, width: 700, x: 10, y: 20 },
      isMaximized: false
    });
    const currentBounds = { height: 740, width: 1180, x: 222, y: 111 };
    const window = createWindow(currentBounds, { isMaximized: true });

    applyMainWindowLayout(window, stateFilePath, NoteLayoutPreference.LIST);

    expect(readMainWindowState(stateFilePath)).toEqual({ bounds: currentBounds, isMaximized: true });
    expect(window.unmaximize).toHaveBeenCalledOnce();
    expect(window.setBounds).toHaveBeenCalledWith({
      height: defaultMainWindowListBounds.height,
      width: defaultMainWindowListBounds.width,
      x: currentBounds.x,
      y: currentBounds.y
    });
    expect(window.setResizable).toHaveBeenCalledWith(false);
    expect(window.setMaximizable).toHaveBeenCalledWith(false);
  });

  it("switches a non-resizable list window without overwriting saved grid state", async () => {
    const savedState: AppWindowState = {
      bounds: { height: 740, width: 1180, x: 222, y: 111 },
      isMaximized: false
    };
    const stateFilePath = await writeMainWindowState(savedState);
    const currentBounds = { height: 800, width: 480, x: 333, y: 444 };
    const window = createWindow(currentBounds, { isResizable: false });

    applyMainWindowLayout(window, stateFilePath, NoteLayoutPreference.LIST);

    expect(readMainWindowState(stateFilePath)).toEqual(savedState);
    expect(window.unmaximize).not.toHaveBeenCalled();
    expect(window.setBounds).toHaveBeenCalledWith({
      height: defaultMainWindowListBounds.height,
      width: defaultMainWindowListBounds.width,
      x: currentBounds.x,
      y: currentBounds.y
    });
  });

  it("switches back to saved grid bounds and restores maximized state", async () => {
    const state: AppWindowState = {
      bounds: { height: 740, width: 1180, x: 222, y: 111 },
      isMaximized: true
    };
    const stateFilePath = await writeMainWindowState(state);
    const window = createWindow({ height: 800, width: 480, x: 222, y: 111 }, { isResizable: false });

    applyMainWindowLayout(window, stateFilePath, NoteLayoutPreference.GRID);

    expect(window.setResizable).toHaveBeenCalledWith(true);
    expect(window.setMaximizable).toHaveBeenCalledWith(true);
    expect(window.setBounds).toHaveBeenCalledWith(state.bounds);
    expect(window.maximize).toHaveBeenCalledOnce();
  });

  it("switches back to saved grid bounds without maximizing a normally restored window", async () => {
    const state: AppWindowState = {
      bounds: { height: 740, width: 1180, x: 222, y: 111 },
      isMaximized: false
    };
    const stateFilePath = await writeMainWindowState(state);
    const window = createWindow({ height: 800, width: 480, x: 222, y: 111 }, { isResizable: false });

    applyMainWindowLayout(window, stateFilePath, NoteLayoutPreference.GRID);

    expect(window.setBounds).toHaveBeenCalledWith(state.bounds);
    expect(window.maximize).not.toHaveBeenCalled();
  });
});

type WindowOptions = {
  isFullScreen?: boolean;
  isMaximized?: boolean;
  isResizable?: boolean;
  normalBounds?: AppWindowState["bounds"];
};

function createWindow(bounds: AppWindowState["bounds"], options: WindowOptions | boolean): BrowserWindow & {
  maximize: ReturnType<typeof vi.fn>;
  setBounds: ReturnType<typeof vi.fn>;
  setMaximizable: ReturnType<typeof vi.fn>;
  setResizable: ReturnType<typeof vi.fn>;
  unmaximize: ReturnType<typeof vi.fn>;
} {
  const windowOptions = typeof options === "boolean" ? { isMaximized: options } : options;

  return {
    getBounds: () => bounds,
    getNormalBounds: () => windowOptions.normalBounds ?? bounds,
    isFullScreen: () => windowOptions.isFullScreen ?? false,
    isMaximized: () => windowOptions.isMaximized ?? false,
    isResizable: () => windowOptions.isResizable ?? true,
    maximize: vi.fn(),
    setBounds: vi.fn(),
    setMaximizable: vi.fn(),
    setResizable: vi.fn(),
    unmaximize: vi.fn()
  } as unknown as BrowserWindow & {
    maximize: ReturnType<typeof vi.fn>;
    setBounds: ReturnType<typeof vi.fn>;
    setMaximizable: ReturnType<typeof vi.fn>;
    setResizable: ReturnType<typeof vi.fn>;
    unmaximize: ReturnType<typeof vi.fn>;
  };
}

async function writeMainWindowState(state: AppWindowState): Promise<string> {
  const directory = await createTemporaryDirectory();
  const stateFilePath = path.join(directory, "main-window-state.json");
  await fs.promises.writeFile(stateFilePath, JSON.stringify(state), "utf-8");
  return stateFilePath;
}

async function createTemporaryDirectory(): Promise<string> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-main-window-state-"));
  temporaryDirectories.push(directory);
  return directory;
}
