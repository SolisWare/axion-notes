/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

test.describe("Splash window", () => {
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

  test("closes after the main window becomes visible", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await expect(desktopApp.page.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeVisible();
    await expect.poll(() => desktopApp!.app.evaluate(({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows().filter((window) => !window.isDestroyed() && window.webContents.getURL().endsWith("/splash.html")).length;
    })).toBe(0);
  });
});
