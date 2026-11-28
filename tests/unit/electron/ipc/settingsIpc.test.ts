/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { registerSettingsIpc } from "../../../../electron/ipc/settingsIpc";

const { getAllWindows, handlers, listeners } = vi.hoisted(() => ({
  getAllWindows: vi.fn(),
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  listeners: new Map<string, (...args: unknown[]) => unknown>()
}));

vi.mock("electron", () => ({
  BrowserWindow: { getAllWindows },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler)),
    on: vi.fn((channel: string, listener: (...args: unknown[]) => unknown) => listeners.set(channel, listener))
  }
}));

describe("settings IPC", () => {
  beforeEach(() => {
    getAllWindows.mockReset();
    handlers.clear();
    listeners.clear();
  });

  it("returns settings and the protected settings folder location", async () => {
    const settings = { language: "en" };
    const settingsService = {
      getSettings: vi.fn().mockResolvedValue(settings),
      getSettingsFolderLocation: vi.fn(() => "/app/settings"),
      setSettings: vi.fn()
    };
    registerSettingsIpc({
      lockStateService: { getIsLocked: vi.fn(() => false) },
      settingsService
    } as never);

    await expect(invokeHandle(channels.settings.getSettings)).resolves.toEqual(settings);
    await expect(invokeHandle(channels.settings.getSettingsFolderLocation)).resolves.toBe("/app/settings");
  });

  it("broadcasts setting changes to every live window and invokes the application callback", () => {
    const liveWindow = { webContents: { isDestroyed: vi.fn(() => false), send: vi.fn() } };
    const destroyedWindow = { webContents: { isDestroyed: vi.fn(() => true), send: vi.fn() } };
    const settings = { language: "es" };
    const onSettingsChange = vi.fn();
    const settingsService = { getSettings: vi.fn(), getSettingsFolderLocation: vi.fn(), setSettings: vi.fn() };
    getAllWindows.mockReturnValue([liveWindow, destroyedWindow]);
    registerSettingsIpc({
      lockStateService: { getIsLocked: vi.fn(() => false) },
      onSettingsChange,
      settingsService
    } as never);

    emit(channels.settings.setSettings, settings);

    expect(settingsService.setSettings).toHaveBeenCalledWith(settings);
    expect(onSettingsChange).toHaveBeenCalledWith(settings);
    expect(liveWindow.webContents.send).toHaveBeenCalledWith(channels.settings.onSettingsChange, settings);
    expect(destroyedWindow.webContents.send).not.toHaveBeenCalled();
  });

  it("prevents protected reads and writes while locked but leaves the lock-screen settings read available", async () => {
    const settingsService = { getSettings: vi.fn().mockResolvedValue({ language: "en" }), getSettingsFolderLocation: vi.fn(), setSettings: vi.fn() };
    registerSettingsIpc({
      lockStateService: { getIsLocked: vi.fn(() => true) },
      settingsService
    } as never);

    await expect(invokeHandle(channels.settings.getSettings)).resolves.toEqual({ language: "en" });
    await expect(invokeHandle(channels.settings.getSettingsFolderLocation)).resolves.toBe("");
    emit(channels.settings.setSettings, { language: "es" });

    expect(settingsService.setSettings).not.toHaveBeenCalled();
  });
});

async function invokeHandle(channel: string): Promise<unknown> {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No handler registered for ${channel}.`);
  }

  return handler({});
}

function emit(channel: string, ...args: unknown[]): void {
  const listener = listeners.get(channel);

  if (!listener) {
    throw new Error(`No listener registered for ${channel}.`);
  }

  listener({}, ...args);
}
