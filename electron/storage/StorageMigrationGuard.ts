/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app, BrowserWindow, dialog } from "electron";
import { NoteService } from "./NoteService";
import { translate } from "../utils/electronI18n";

const allowedWindowCloses = new WeakSet<BrowserWindow>();
let isQuitConfirmed = false;

/**
 * Blocks casual window/app closes while encrypted note storage is migrating.
 *
 * Migration continues in the main process, so closing the progress window can
 * leave users without visible status. Quitting during the filesystem swap is
 * riskier and requires explicit confirmation.
 */
export function registerStorageMigrationGuard(noteService: NoteService): void {
  app.on("browser-window-created", (_event, window) => {
    window.on("close", (event) => {
      if (!noteService.getIsStorageMigrationInProgress() || isQuitConfirmed || allowedWindowCloses.has(window)) {
        allowedWindowCloses.delete(window);
        return;
      }

      event.preventDefault();

      const shouldClose = dialog.showMessageBoxSync(window, {
        type: "warning",
        buttons: [
          translate("electron.storageMigration.keepWaiting"),
          translate("electron.storageMigration.closeAnyway")
        ],
        cancelId: 0,
        defaultId: 0,
        message: translate("electron.storageMigration.windowCloseTitle"),
        detail: translate("electron.storageMigration.windowCloseMessage")
      }) === 1;

      if (shouldClose) {
        allowedWindowCloses.add(window);
        window.close();
      }
    });
  });

  app.on("before-quit", (event) => {
    if (!noteService.getIsStorageMigrationInProgress() || isQuitConfirmed) {
      return;
    }

    event.preventDefault();

    const shouldQuit = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow() ?? undefined, {
      type: "warning",
      buttons: [
        translate("electron.storageMigration.keepWaiting"),
        translate("electron.storageMigration.quitAnyway")
      ],
      cancelId: 0,
      defaultId: 0,
      message: translate("electron.storageMigration.quitTitle"),
      detail: translate("electron.storageMigration.quitMessage")
    }) === 1;

    if (shouldQuit) {
      isQuitConfirmed = true;
      app.quit();
    }
  });
}
