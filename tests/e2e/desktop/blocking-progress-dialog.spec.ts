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

const encryptionProgressChannel = "security.onEncryptionProgress";

test.describe("Blocking progress dialog", () => {
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

  test("shows migration progress in Settings and cannot be dismissed", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();

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
    await settingsPage.getByRole("button", { name: "Security" }).click();
    await expect(settingsPage.getByRole("heading", { name: "Security" })).toBeVisible();

    await sendEncryptionProgress(desktopApp, {
      operation: "encrypt",
      phase: "processingNotes",
      current: 2,
      total: 4,
      progress: 50
    });

    const progressDialog = settingsPage.getByRole("dialog", { name: "Encrypting notes" });

    await expect(progressDialog).toBeVisible();
    await expect(progressDialog).toContainText("Encrypting 2 of 4");
    await expect(progressDialog).toContainText("50%");
    await expect(settingsPage.getByRole("progressbar", { name: "Encrypting notes" })).toHaveAttribute("aria-valuenow", "50");

    await settingsPage.keyboard.press("Escape");
    await expect(progressDialog).toBeVisible();

    await settingsPage.locator(".MuiBackdrop-root").dispatchEvent("click");
    await expect(progressDialog).toBeVisible();
  });
});

async function sendEncryptionProgress(desktopApp: TestElectronApp, progress: object): Promise<void> {
  await desktopApp.app.evaluate(({ BrowserWindow }, { channel, progressEvent }) => {
    const settingsWindow = BrowserWindow.getAllWindows().find((window) =>
      !window.isDestroyed() && window.webContents.getURL().includes("settings")
    );

    if (!settingsWindow) {
      throw new Error("Could not find the Settings window to send the encryption progress event.");
    }

    settingsWindow.webContents.send(channel, progressEvent);
  }, {
    channel: encryptionProgressChannel,
    progressEvent: progress
  });
}
