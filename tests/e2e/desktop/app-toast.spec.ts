/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import { expect, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

const secureLockCompleteChannel = "security.onSecureLockComplete";

test.describe("App toast", () => {
  let desktopApp: TestElectronApp | undefined;
  let userDataDir: string | undefined;

  test.afterEach(async () => {
    await desktopApp?.close();
    desktopApp = undefined;

    if (userDataDir) {
      await removeTestUserDataDir(userDataDir);
      userDataDir = undefined;
    }
  });

  test("shows and dismisses the secure-lock completion notification", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();

    await desktopApp.app.evaluate(({ BrowserWindow }, channel) => {
      const mainWindow = BrowserWindow.getAllWindows().find((window) => !window.isDestroyed());

      if (!mainWindow) {
        throw new Error("Could not find the main window to send the secure-lock completion event.");
      }

      mainWindow.webContents.send(channel);
    }, secureLockCompleteChannel);

    const toast = desktopApp.page.getByRole("status");

    await expect(toast).toHaveText("Decrypted notes cleared from memory.");
    await expect(toast).toBeHidden({ timeout: 4_000 });
  });
});
