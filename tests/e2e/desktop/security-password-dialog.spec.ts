/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import { expect, Page, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

const lockPassword = "V7$kQ2!xLp9#Nz4";

test.describe("Security password dialog", () => {
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

  test("sets a lock password, locks notes, and unlocks them", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();

    const settingsPage = await openSettings(desktopApp);
    await settingsPage.getByRole("button", { name: "Security" }).click();
    await expect(settingsPage.getByRole("heading", { name: "Security" })).toBeVisible();

    await settingsPage.locator('label:has(input[aria-labelledby="lock-screen-enabled-title"])').click();
    await expect(settingsPage.getByRole("dialog", { name: "Set lock password" })).toBeVisible();
    await settingsPage.getByLabel("New password").fill(lockPassword);
    await settingsPage.getByLabel("Confirm password").fill(lockPassword);
    await settingsPage.getByRole("button", { name: "Set password" }).click();

    await expect(settingsPage.getByRole("dialog", { name: "Set lock password" })).not.toBeVisible();
    await expect(settingsPage.getByRole("checkbox", { name: "Lock screen" })).toBeChecked();

    await desktopApp.app.evaluate(({ Menu }) => {
      const lockNotesMenuItem = Menu.getApplicationMenu()?.getMenuItemById("lockNotes");

      if (!lockNotesMenuItem) {
        throw new Error("Could not find the Lock Notes menu item.");
      }

      lockNotesMenuItem.click(undefined as never, undefined as never, undefined as never);
    });

    await expect(desktopApp.page.getByRole("heading", { name: "Your notes are locked" })).toBeVisible();
    await desktopApp.page.locator("#unlock-password").fill(lockPassword);
    await desktopApp.page.getByRole("button", { name: "Unlock notes" }).click();

    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();
  });
});

async function openSettings(desktopApp: TestElectronApp): Promise<Page> {
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
