/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

test.describe("Welcome screen", () => {
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

  test("opens on the Welcome screen with fresh desktop app data", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await expect(desktopApp.page.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeVisible();
    await expect(desktopApp.page.getByRole("button", { name: "Get Started" })).toBeVisible();
  });

  test("opens the notes view after Get Started", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();

    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();
    await expect(desktopApp.page.getByRole("heading", { name: "Welcome to Axion Notes" })).not.toBeVisible();
  });

  test("returns to the empty notes state after deleting the final note from the native menu", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await clickNativeMenuItem(desktopApp, "newNote");
    await expect(desktopApp.page.getByPlaceholder("Title")).toBeVisible();

    await clickNativeMenuItem(desktopApp, "deleteAllNotes");
    await expect(desktopApp.page.getByRole("heading", { name: "Delete All Notes" })).toBeVisible();
    await desktopApp.page.getByRole("button", { name: "Delete All" }).click();

    await expect(desktopApp.page.getByRole("heading", { name: "You don't have any notes yet!" })).toBeVisible();
  });

  test("shows the Welcome screen again on relaunch by default", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();
    await desktopApp.close();
    desktopApp = undefined;

    desktopApp = await launchTestElectronApp(userDataDir);

    await expect(desktopApp.page.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeVisible();
  });

  test("skips the Welcome screen after Do not show again is selected", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("checkbox", { name: "Do not show this welcome screen again" }).check();
    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();
    await desktopApp.close();
    desktopApp = undefined;

    desktopApp = await launchTestElectronApp(userDataDir);

    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();
    await expect(desktopApp.page.getByRole("heading", { name: "Welcome to Axion Notes" })).not.toBeVisible();
  });

  test("opens the Welcome screen from the native Help menu", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("checkbox", { name: "Do not show this welcome screen again" }).check();
    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();

    await desktopApp.app.evaluate(({ Menu }) => {
      const welcomeMenuItem = Menu.getApplicationMenu()?.getMenuItemById("welcome");
      welcomeMenuItem?.click(undefined as never, undefined as never, undefined as never);
    });

    await expect(desktopApp.page.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeVisible();
    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();
  });
});

async function clickNativeMenuItem(desktopApp: TestElectronApp, menuItemId: string): Promise<void> {
  await expect.poll(() => desktopApp.app.evaluate(({ Menu }, id) => {
    return Menu.getApplicationMenu()?.getMenuItemById(id)?.enabled ?? false;
  }, menuItemId)).toBe(true);

  await desktopApp.app.evaluate(({ Menu }, id) => {
    const menuItem = Menu.getApplicationMenu()?.getMenuItemById(id);

    if (!menuItem) {
      throw new Error(`Could not find the ${id} menu item.`);
    }

    menuItem.click(undefined as never, undefined as never, undefined as never);
  }, menuItemId);
}
