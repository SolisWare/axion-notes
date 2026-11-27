/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindow } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { registerAppWindowIpc } from "../../../../electron/ipc/appWindowIpc";

const { exit, getAllWindows, handlers, relaunch, suppressMainWindowStateSaveOnClose } = vi.hoisted(() => ({
  exit: vi.fn(),
  getAllWindows: vi.fn<() => BrowserWindow[]>(),
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  relaunch: vi.fn(),
  suppressMainWindowStateSaveOnClose: vi.fn()
}));

vi.mock("electron", () => ({
  app: { exit, relaunch },
  BrowserWindow: { getAllWindows },
  ipcMain: { on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler)) }
}));

vi.mock("../../../../electron/windows/mainWindowState", () => ({
  applyMainWindowLayout: vi.fn(),
  suppressMainWindowStateSaveOnClose
}));

describe("app window IPC", () => {
  beforeEach(() => {
    exit.mockReset();
    getAllWindows.mockReset();
    handlers.clear();
    relaunch.mockReset();
    suppressMainWindowStateSaveOnClose.mockReset();
  });

  it("preserves restored main-window state by suppressing saves from every closing app window", async () => {
    const mainWindow = {} as BrowserWindow;
    const settingsWindow = {} as BrowserWindow;
    const lockStateService = { getIsLocked: vi.fn(() => false) };
    const settingsService = { waitForPendingSettingsWrite: vi.fn().mockResolvedValue(undefined) };
    getAllWindows.mockReturnValue([mainWindow, settingsWindow]);

    registerAppWindowIpc({
      lockStateService,
      mainWindowStateFilePath: "main-window-state.json",
      settingsService
    } as never);

    await emit(channels.appWindow.restart, { preserveMainWindowState: true });

    expect(settingsService.waitForPendingSettingsWrite).toHaveBeenCalledOnce();
    expect(suppressMainWindowStateSaveOnClose).toHaveBeenNthCalledWith(1, mainWindow);
    expect(suppressMainWindowStateSaveOnClose).toHaveBeenNthCalledWith(2, settingsWindow);
    expect(relaunch).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledWith(0);
  });

  it("allows ordinary restarts to save the current main-window state", async () => {
    const settingsService = { waitForPendingSettingsWrite: vi.fn().mockResolvedValue(undefined) };
    registerAppWindowIpc({
      lockStateService: { getIsLocked: vi.fn(() => false) },
      mainWindowStateFilePath: "main-window-state.json",
      settingsService
    } as never);

    await emit(channels.appWindow.restart);

    expect(suppressMainWindowStateSaveOnClose).not.toHaveBeenCalled();
    expect(relaunch).toHaveBeenCalledOnce();
    expect(exit).toHaveBeenCalledWith(0);
  });
});

async function emit(channel: string, ...args: unknown[]): Promise<void> {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No IPC listener registered for ${channel}.`);
  }

  await handler({ sender: {} }, ...args);
}
