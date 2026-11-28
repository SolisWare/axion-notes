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
import { NoteLayoutPreference } from "../../../../src/settings/NoteLayoutPreference";

const {
  applyMainWindowLayout,
  exit,
  fromWebContents,
  getAllWindows,
  handlers,
  relaunch,
  suppressMainWindowStateSaveOnClose
} = vi.hoisted(() => ({
  applyMainWindowLayout: vi.fn(),
  exit: vi.fn(),
  fromWebContents: vi.fn(),
  getAllWindows: vi.fn<() => BrowserWindow[]>(),
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  relaunch: vi.fn(),
  suppressMainWindowStateSaveOnClose: vi.fn()
}));

vi.mock("electron", () => ({
  app: { exit, relaunch },
  BrowserWindow: { fromWebContents, getAllWindows },
  ipcMain: { on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler)) }
}));

vi.mock("../../../../electron/windows/mainWindowState", () => ({
  applyMainWindowLayout,
  suppressMainWindowStateSaveOnClose
}));

describe("app window IPC", () => {
  beforeEach(() => {
    applyMainWindowLayout.mockReset();
    exit.mockReset();
    fromWebContents.mockReset();
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

  it("closes the requesting window without requiring an unlocked note vault", async () => {
    const window = { close: vi.fn() };
    fromWebContents.mockReturnValue(window);
    registerAppWindowIpc({
      lockStateService: { getIsLocked: vi.fn(() => true) },
      mainWindowStateFilePath: "main-window-state.json",
      settingsService: { waitForPendingSettingsWrite: vi.fn() }
    } as never);

    await emit(channels.appWindow.close);

    expect(window.close).toHaveBeenCalledOnce();
  });

  it("updates the requesting window's always-on-top state and applies valid layouts", async () => {
    const window = { setAlwaysOnTop: vi.fn() };
    fromWebContents.mockReturnValue(window);
    registerAppWindowIpc({
      lockStateService: { getIsLocked: vi.fn(() => false) },
      mainWindowStateFilePath: "main-window-state.json",
      settingsService: { waitForPendingSettingsWrite: vi.fn() }
    } as never);

    await emit(channels.appWindow.setAlwaysOnTop, true);
    await emit(channels.appWindow.setLayout, NoteLayoutPreference.LIST);
    await emit(channels.appWindow.setLayout, "invalid-layout");

    expect(window.setAlwaysOnTop).toHaveBeenCalledWith(true);
    expect(applyMainWindowLayout).toHaveBeenCalledWith(window, "main-window-state.json", NoteLayoutPreference.LIST);
    expect(applyMainWindowLayout).toHaveBeenCalledOnce();
  });

  it("does not perform protected window operations while the note vault is locked", async () => {
    const window = { setAlwaysOnTop: vi.fn() };
    const settingsService = { waitForPendingSettingsWrite: vi.fn() };
    fromWebContents.mockReturnValue(window);
    registerAppWindowIpc({
      lockStateService: { getIsLocked: vi.fn(() => true) },
      mainWindowStateFilePath: "main-window-state.json",
      settingsService
    } as never);

    await emit(channels.appWindow.restart);
    await emit(channels.appWindow.setAlwaysOnTop, true);
    await emit(channels.appWindow.setLayout, NoteLayoutPreference.GRID);

    expect(settingsService.waitForPendingSettingsWrite).not.toHaveBeenCalled();
    expect(relaunch).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(window.setAlwaysOnTop).not.toHaveBeenCalled();
    expect(applyMainWindowLayout).not.toHaveBeenCalled();
  });
});

async function emit(channel: string, ...args: unknown[]): Promise<void> {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No IPC listener registered for ${channel}.`);
  }

  await handler({ sender: {} }, ...args);
}
