/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindow } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RichTextFormatCommand } from "../../../../src/types/RichTextFormatCommand";
import { channels } from "../../../../electron/ipc/channels";

const isRichTextFormattingActive = vi.hoisted(() => vi.fn());

vi.mock("electron", () => ({}));
vi.mock("../../../../electron/ipc/menuIpc", () => ({ isRichTextFormattingActive }));

import { registerRichTextShortcuts } from "../../../../electron/utils/richTextShortcuts";

type InputHandler = (event: { preventDefault: () => void }, input: Record<string, unknown>) => void;

describe("richTextShortcuts", () => {
  const platform = process.platform;

  beforeEach(() => {
    isRichTextFormattingActive.mockReset().mockReturnValue(true);
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { configurable: true, value: platform });
  });

  it("increases and decreases font size for active formatted text", () => {
    const window = createWindow();
    registerRichTextShortcuts(window.browserWindow);

    expect(sendShortcut(window.handler, { ...modifierInput(), key: "+" })).toBe(true);
    expect(sendShortcut(window.handler, { ...modifierInput(), key: "=" })).toBe(true);
    expect(sendShortcut(window.handler, { ...modifierInput(), key: "-" })).toBe(true);
    expect(window.send).toHaveBeenNthCalledWith(1, channels.menu.formatRichText, RichTextFormatCommand.INCREASE_FONT_SIZE);
    expect(window.send).toHaveBeenNthCalledWith(2, channels.menu.formatRichText, RichTextFormatCommand.INCREASE_FONT_SIZE);
    expect(window.send).toHaveBeenNthCalledWith(3, channels.menu.formatRichText, RichTextFormatCommand.DECREASE_FONT_SIZE);
  });

  it("does not intercept unsupported, inactive, or modified shortcuts", () => {
    const window = createWindow();
    registerRichTextShortcuts(window.browserWindow);

    expect(sendShortcut(window.handler, { ...modifierInput(), key: "b" })).toBe(false);
    expect(sendShortcut(window.handler, { ...modifierInput(), alt: true, key: "+" })).toBe(false);
    expect(sendShortcut(window.handler, { key: "+" })).toBe(false);
    isRichTextFormattingActive.mockReturnValue(false);
    expect(sendShortcut(window.handler, { ...modifierInput(), key: "+" })).toBe(false);
    expect(window.send).not.toHaveBeenCalled();
  });

  it("uses Control rather than Command outside macOS", () => {
    Object.defineProperty(process, "platform", { configurable: true, value: "win32" });
    const window = createWindow();
    registerRichTextShortcuts(window.browserWindow);

    expect(sendShortcut(window.handler, { control: true, key: "+" })).toBe(true);
    expect(sendShortcut(window.handler, { key: "+", meta: true })).toBe(false);
  });
});

function createWindow(): { browserWindow: BrowserWindow; handler: InputHandler; send: ReturnType<typeof vi.fn> } {
  let handler: InputHandler | undefined;
  const send = vi.fn();

  return {
    browserWindow: {
      webContents: {
        on: vi.fn((event: string, listener: InputHandler) => {
          if (event === "before-input-event") {
            handler = listener;
          }
        }),
        send
      }
    } as unknown as BrowserWindow,
    get handler() {
      if (!handler) {
        throw new Error("Expected rich-text shortcut handler to be registered.");
      }

      return handler;
    },
    send
  };
}

function sendShortcut(handler: InputHandler, input: Record<string, unknown>): boolean {
  const preventDefault = vi.fn();
  handler({ preventDefault }, input);
  return preventDefault.mock.calls.length === 1;
}

function modifierInput(): Record<string, boolean> {
  return process.platform === "darwin" ? { meta: true } : { control: true };
}
