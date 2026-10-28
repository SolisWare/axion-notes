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

test.describe("View menu", () => {
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

  test("switches between grid and list views", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();

    await clickViewMenuItem(desktopApp, "listView");

    await expect.poll(() => getMainWindowIsResizable(desktopApp!)).toBe(false);
    await expect.poll(() => getViewMenuItemState(desktopApp!, "listView")).toEqual({ checked: true, label: "List view" });
    await expect.poll(() => getViewMenuItemState(desktopApp!, "gridView")).toEqual({ checked: false, label: "Grid view" });

    await clickViewMenuItem(desktopApp, "gridView");

    await expect.poll(() => getMainWindowIsResizable(desktopApp!)).toBe(true);
    await expect.poll(() => getViewMenuItemState(desktopApp!, "gridView")).toEqual({ checked: true, label: "Grid view" });
    await expect.poll(() => getViewMenuItemState(desktopApp!, "listView")).toEqual({ checked: false, label: "List view" });
  });
});

async function clickViewMenuItem(desktopApp: TestElectronApp, menuItemId: string): Promise<void> {
  await desktopApp.app.evaluate(({ Menu }, id) => {
    const menuItem = Menu.getApplicationMenu()?.getMenuItemById(id);

    if (!menuItem) {
      throw new Error(`Could not find the ${id} View menu item.`);
    }

    menuItem.click(undefined as never, undefined as never, undefined as never);
  }, menuItemId);
}

async function getMainWindowIsResizable(desktopApp: TestElectronApp): Promise<boolean | undefined> {
  return desktopApp.app.evaluate(({ BrowserWindow }) => {
    return BrowserWindow.getAllWindows()
      .find((window) => !window.isDestroyed() && window.webContents.getURL().includes("#/main"))
      ?.isResizable();
  });
}

async function getViewMenuItemState(desktopApp: TestElectronApp, menuItemId: string): Promise<{ checked: boolean; label: string } | undefined> {
  return desktopApp.app.evaluate(({ Menu }, id) => {
    const menuItem = Menu.getApplicationMenu()?.getMenuItemById(id);

    return menuItem
      ? { checked: menuItem.checked, label: menuItem.label }
      : undefined;
  }, menuItemId);
}
