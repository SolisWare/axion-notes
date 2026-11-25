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

  test("reuses the existing Settings window instead of opening a duplicate", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    const settingsPage = await openSettings(desktopApp);
    await expect(settingsPage.getByRole("heading", { level: 1, name: "General" })).toBeVisible();

    await clickSettingsMenuItem(desktopApp);

    await expect.poll(() => desktopApp!.app.evaluate(({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows().filter((window) => !window.isDestroyed() && window.webContents.getURL().includes("#/settings")).length;
    })).toBe(1);
    await expect(settingsPage.getByRole("heading", { level: 1, name: "General" })).toBeVisible();
  });

  test("disables drag-and-drop sorting from Appearance without moving the note layout", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await desktopApp.page.evaluate(async () => {
      await window.api.storage.setNote({
        bgcolor: "yellow",
        content: "Drag sorting preference test",
        createdOn: new Date("2026-11-19T00:00:00.000Z"),
        id: "drag-sorting-note",
        lastModifiedOn: new Date("2026-11-19T00:00:00.000Z"),
        title: "Drag sorting preference"
      });
    });
    await desktopApp.page.reload();
    const title = desktopApp.page.getByPlaceholder("Title");
    await expect(title).toBeVisible();
    const note = title.locator("xpath=ancestor::div[contains(@class, 'MuiPaper-root')]");
    const dragIndicator = note.locator("div[aria-hidden='true']").first();
    await expect(dragIndicator).toBeVisible();
    const titleBeforeDisablingSorting = await title.boundingBox();

    const settingsPage = await openSettings(desktopApp);
    await settingsPage.getByRole("button", { name: "Appearance" }).click();
    const dragAndDropSorting = settingsPage.getByRole("checkbox", { name: "Allow drag-and-drop note sorting" });
    await dragAndDropSorting.uncheck({ force: true });
    await expect(dragAndDropSorting).not.toBeChecked();

    await expect(dragIndicator).toBeHidden();
    expect((await title.boundingBox())?.y).toBe(titleBeforeDisablingSorting?.y);
    await expect.poll(async () => (await desktopApp!.page.evaluate(() => window.api.settings.getSettings()))?.dragAndDropSortingEnabled).toBe(false);
  });
});

async function openSettings(desktopApp: TestElectronApp) {
  const settingsPagePromise = desktopApp.app.waitForEvent("window");
  await clickSettingsMenuItem(desktopApp);

  const settingsPage = await settingsPagePromise;
  await settingsPage.waitForLoadState("domcontentloaded");

  return settingsPage;
}

async function clickSettingsMenuItem(desktopApp: TestElectronApp): Promise<void> {
  await desktopApp.app.evaluate(({ Menu }) => {
    const settingsMenuItem = Menu.getApplicationMenu()?.getMenuItemById("settings");

    if (!settingsMenuItem) {
      throw new Error("Could not find the Settings menu item.");
    }

    settingsMenuItem.click(undefined as never, undefined as never, undefined as never);
  });
}
