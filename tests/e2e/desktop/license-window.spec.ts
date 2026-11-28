/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

test.describe("License window", () => {
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

  test("opens the native license window from Help and reuses it", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    const licenseWindowPromise = desktopApp.app.waitForEvent("window");
    await clickLicenseMenuItem(desktopApp);
    const licenseWindow = await licenseWindowPromise;

    await licenseWindow.waitForLoadState("domcontentloaded");
    await expect(licenseWindow.getByRole("heading", { name: "Axion Notes License Notice" })).toBeVisible();

    await clickLicenseMenuItem(desktopApp);
    await expect.poll(() => getOpenLicenseWindowCount(desktopApp!)).toBe(1);
  });
});

async function clickLicenseMenuItem(desktopApp: TestElectronApp): Promise<void> {
  await desktopApp.app.evaluate(({ Menu }) => {
    const licenseMenuItem = Menu.getApplicationMenu()?.getMenuItemById("viewLicense");

    if (!licenseMenuItem) {
      throw new Error("Could not find the View License menu item.");
    }

    licenseMenuItem.click(undefined as never, undefined as never, undefined as never);
  });
}

async function getOpenLicenseWindowCount(desktopApp: TestElectronApp): Promise<number> {
  return desktopApp.app.evaluate(({ BrowserWindow }) => {
    return BrowserWindow.getAllWindows().filter((window) => {
      return !window.isDestroyed() && window.webContents.getURL().includes("#/license");
    }).length;
  });
}
