/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindow } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";

const isDev = vi.hoisted(() => ({ value: false }));
const isMac = vi.hoisted(() => ({ value: false }));

vi.mock("electron", () => ({}));
vi.mock("../../../../electron/utils/isDev", () => ({
  get isDev() {
    return isDev.value;
  }
}));
vi.mock("../../../../electron/utils/Platform", () => ({
  get isMac() {
    return isMac.value;
  }
}));

import { blockProductionDevTools, getDevToolsWebPreferences } from "../../../../electron/utils/devTools";

type EventHandler = (...args: any[]) => void;

describe("devTools", () => {
  beforeEach(() => {
    isDev.value = false;
    isMac.value = false;
  });

  it("enables DevTools only during development", () => {
    isDev.value = true;
    expect(getDevToolsWebPreferences()).toEqual({ devTools: true });

    isDev.value = false;
    expect(getDevToolsWebPreferences()).toEqual({ devTools: false });
  });

  it("does not register production protections during development", () => {
    isDev.value = true;
    const window = createWindow();

    blockProductionDevTools(window.browserWindow);

    expect(window.on).not.toHaveBeenCalled();
  });

  it("closes opened DevTools and blocks Windows and Linux shortcuts in production", () => {
    const window = createWindow();
    blockProductionDevTools(window.browserWindow);

    window.handlers["devtools-opened"]();
    expect(window.closeDevTools).toHaveBeenCalledOnce();

    expect(blockShortcut(window.handlers, { control: true, key: "i", shift: true })).toBe(true);
    expect(blockShortcut(window.handlers, { key: "F12" })).toBe(true);
    expect(blockShortcut(window.handlers, { control: true, key: "p", shift: true })).toBe(false);
    expect(blockShortcut(window.handlers, { alt: true, control: true, key: "i", shift: true })).toBe(true);
  });

  it("blocks the macOS DevTools shortcut in production", () => {
    isMac.value = true;
    const window = createWindow();
    blockProductionDevTools(window.browserWindow);

    expect(blockShortcut(window.handlers, { alt: true, key: "I", meta: true })).toBe(true);
    expect(blockShortcut(window.handlers, { control: true, key: "i", shift: true })).toBe(false);
  });
});

function createWindow(): { browserWindow: BrowserWindow; closeDevTools: ReturnType<typeof vi.fn>; handlers: Record<string, EventHandler>; on: ReturnType<typeof vi.fn> } {
  const handlers: Record<string, EventHandler> = {};
  const closeDevTools = vi.fn();
  const on = vi.fn((event: string, listener: EventHandler) => {
    handlers[event] = listener;
  });

  return {
    browserWindow: {
      webContents: { closeDevTools, on }
    } as unknown as BrowserWindow,
    closeDevTools,
    handlers,
    on
  };
}

function blockShortcut(handlers: Record<string, EventHandler>, input: Record<string, unknown>): boolean {
  const preventDefault = vi.fn();
  handlers["before-input-event"]({ preventDefault }, input);
  return preventDefault.mock.calls.length === 1;
}
