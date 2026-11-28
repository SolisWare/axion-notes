/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { registerSystemThemeIpc } from "../../../../electron/ipc/systemThemeIpc";

const { getAllWindows, handle, nativeThemeEvents, nativeThemeOn, resolveSystemTheme } = vi.hoisted(() => ({
  getAllWindows: vi.fn(),
  handle: vi.fn(),
  nativeThemeEvents: new Map<string, (...args: unknown[]) => unknown>(),
  nativeThemeOn: vi.fn((event: string, listener: (...args: unknown[]) => unknown) => nativeThemeEvents.set(event, listener)),
  resolveSystemTheme: vi.fn()
}));

vi.mock("electron", () => ({
  BrowserWindow: { getAllWindows },
  ipcMain: { handle },
  nativeTheme: { on: nativeThemeOn, shouldUseDarkColors: false }
}));

vi.mock("../../../../src/theme/SystemTheme", () => ({ resolveSystemTheme }));

describe("system theme IPC", () => {
  beforeEach(() => {
    getAllWindows.mockReset();
    handle.mockReset();
    nativeThemeEvents.clear();
    nativeThemeOn.mockClear();
    resolveSystemTheme.mockReset();
    resolveSystemTheme.mockReturnValue("light");
  });

  it("returns the current theme to a subscriber and forwards later native-theme updates only to live subscribers", () => {
    const firstSender = { id: 1, once: vi.fn(), send: vi.fn(), isDestroyed: vi.fn(() => false) };
    const subscribedWindow = { webContents: firstSender };
    const unrelatedWindow = { webContents: { id: 2, send: vi.fn(), isDestroyed: vi.fn(() => false) } };
    const destroyedSubscriber = { webContents: { id: 3, send: vi.fn(), isDestroyed: vi.fn(() => true) } };
    getAllWindows.mockReturnValue([subscribedWindow, unrelatedWindow, destroyedSubscriber]);
    registerSystemThemeIpc();

    const themeHandler = handle.mock.calls.find(([channel]) => channel === channels.systemTheme.onThemeChange)?.[1] as (event: { sender: typeof firstSender }) => string;
    expect(themeHandler({ sender: firstSender })).toBe("light");
    resolveSystemTheme.mockReturnValue("dark");
    nativeThemeEvents.get("updated")?.();

    expect(firstSender.send).toHaveBeenCalledWith(channels.systemTheme.onThemeChange, "dark");
    expect(unrelatedWindow.webContents.send).not.toHaveBeenCalled();
    expect(destroyedSubscriber.webContents.send).not.toHaveBeenCalled();
  });

  it("removes a subscriber after its web contents are destroyed", () => {
    const sender = { id: 1, once: vi.fn(), send: vi.fn(), isDestroyed: vi.fn(() => false) };
    const window = { webContents: sender };
    getAllWindows.mockReturnValue([window]);
    registerSystemThemeIpc();
    const themeHandler = handle.mock.calls[0][1] as (event: { sender: typeof sender }) => string;

    themeHandler({ sender });
    const onDestroyed = sender.once.mock.calls.find(([event]) => event === "destroyed")?.[1] as () => void;
    onDestroyed();
    nativeThemeEvents.get("updated")?.();

    expect(sender.send).not.toHaveBeenCalled();
  });
});
