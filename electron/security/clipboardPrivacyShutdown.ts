/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app } from "electron";
import { ClipboardPrivacyService } from "./ClipboardPrivacyService";

/**
 * Clears a pending Axion Notes clipboard copy only when Electron is actually exiting.
 */
export function registerClipboardPrivacyShutdown(clipboardPrivacyService: ClipboardPrivacyService): void {
  app.on("will-quit", () => {
    clipboardPrivacyService.clearTrackedNoteCopy();
  });
}
