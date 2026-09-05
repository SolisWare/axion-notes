/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, Input } from "electron";
import { RichTextFormatCommand } from "../../src/models/RichTextFormatCommand";
import { channels } from "../ipc/channels";
import { isRichTextFormattingActive } from "../ipc/menuIpc";

export function registerRichTextShortcuts(window: BrowserWindow): void {
  window.webContents.on("before-input-event", (event, input: Input) => {
    const isModifierPressed = process.platform === "darwin" ? input.meta : input.control;

    if (!isModifierPressed || input.alt || !isRichTextFormattingActive()) {
      return;
    }

    if (input.key === "+" || input.key === "=") {
      event.preventDefault();
      window.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.INCREASE_FONT_SIZE);
      return;
    }

    if (input.key === "-") {
      event.preventDefault();
      window.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.DECREASE_FONT_SIZE);
    }
  });
}
