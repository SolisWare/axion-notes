/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, WebPreferences } from "electron";
import { isDev } from "./isDev";
import { isMac } from "./Platform";

export function getDevToolsWebPreferences(): Pick<WebPreferences, "devTools"> {
  return {
    devTools: isDev
  };
}

export function blockProductionDevTools(window: BrowserWindow): void {
  if (isDev) {
    return;
  }

  window.webContents.on("devtools-opened", () => {
    window.webContents.closeDevTools();
  });

  window.webContents.on("before-input-event", (event, input) => {
    const isDevToolsShortcut = input.key === "F12"
      || (isMac && input.meta && input.alt && input.key.toLowerCase() === "i")
      || (!isMac && input.control && input.shift && input.key.toLowerCase() === "i");

    if (isDevToolsShortcut) {
      event.preventDefault();
    }
  });
}
