/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

test.describe("Settings window", () => {
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

  test("opens Electron-only settings pages and identifies the selected page", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    const settingsPage = await openSettings(desktopApp);

    for (const pageName of ["Security", "Shortcuts", "Data & storage", "Backups"]) {
      const pageButton = settingsPage.getByRole("button", { name: pageName, exact: true });
      await pageButton.click();

      await expect(settingsPage.getByRole("heading", { level: 1, name: pageName })).toBeVisible();
      await expect(pageButton).toHaveAttribute("aria-current", "page");
    }

    await expect(settingsPage.getByRole("button", { name: "About" })).toHaveCount(0);
  });
});

async function openSettings(desktopApp: TestElectronApp) {
  const settingsPagePromise = desktopApp.app.waitForEvent("window");
  await desktopApp.app.evaluate(({ Menu }) => {
    const settingsMenuItem = Menu.getApplicationMenu()?.getMenuItemById("settings");

    if (!settingsMenuItem) {
      throw new Error("Could not find the Settings menu item.");
    }

    settingsMenuItem.click(undefined as never, undefined as never, undefined as never);
  });

  const settingsPage = await settingsPagePromise;
  await settingsPage.waitForLoadState("domcontentloaded");

  return settingsPage;
}
