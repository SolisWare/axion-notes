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

test.describe("Sort notes menu", () => {
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

  test("selects and reapplies a non-custom sort order from Edit", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();

    await clickSortMenuItem(desktopApp, "sortNotes-titleDesc");

    await expect.poll(() => desktopApp!.page.evaluate(async () => {
      return (await window.api.settings.getSettings())?.notesSortOrder;
    })).toBe("titleDesc");
    await expect.poll(() => getSortMenuItemState(desktopApp!, "sortNotes-titleDesc")).toEqual({ checked: true, enabled: true, label: "Title Z-A" });
    await expect.poll(() => getSortMenuItemState(desktopApp!, "sortNotes-dateCreatedAsc")).toEqual({ checked: false, enabled: true, label: "Date created (oldest first)" });
    await expect.poll(() => getSortMenuItemState(desktopApp!, "resortNotes")).toEqual({ checked: false, enabled: true, label: "Re-sort notes" });
    expect(await desktopApp.app.evaluate(({ Menu }) => {
      return Menu.getApplicationMenu()?.getMenuItemById("sortNotes")?.submenu?.items
        .filter((item) => item.type !== "separator" && item.visible)
        .map((item) => item.id);
    })).toEqual([
      "sortNotes-dateCreatedAsc",
      "sortNotes-dateCreatedDesc",
      "sortNotes-lastModified",
      "sortNotes-titleAsc",
      "sortNotes-titleDesc",
      "resortNotes"
    ]);

    await desktopApp.app.evaluate(({ ipcMain }) => {
      (globalThis as typeof globalThis & { resortRequestCount?: number }).resortRequestCount = 0;
      ipcMain.on("noteSort.requestSort", () => {
        const state = globalThis as typeof globalThis & { resortRequestCount?: number };
        state.resortRequestCount = (state.resortRequestCount ?? 0) + 1;
      });
    });
    await clickSortMenuItem(desktopApp, "resortNotes");
    await expect(desktopApp.page.getByRole("status")).toHaveText("Notes re-sorted by Title Z-A");
    await expect.poll(() => desktopApp!.app.evaluate(() => {
      return (globalThis as typeof globalThis & { resortRequestCount?: number }).resortRequestCount;
    })).toBe(1);
  });

  test("shows no selected standard sort order for Custom", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();

    await desktopApp.page.evaluate(async () => {
      const settings = await window.api.settings.getSettings();

      if (!settings) {
        throw new Error("Could not load application settings.");
      }

      window.api.settings.setSettings({ ...settings, notesSortOrder: "custom" as never });
    });

    await expect.poll(() => desktopApp!.page.evaluate(async () => {
      return (await window.api.settings.getSettings())?.notesSortOrder;
    })).toBe("custom");
    await expect.poll(() => getSortMenuItemStates(desktopApp!)).toEqual([
      { checked: false, enabled: true, label: "Date created (oldest first)" },
      { checked: false, enabled: true, label: "Date created (newest first)" },
      { checked: false, enabled: true, label: "Last modified" },
      { checked: false, enabled: true, label: "Title A-Z" },
      { checked: false, enabled: true, label: "Title Z-A" }
    ]);
    await expect.poll(() => getSortMenuItemState(desktopApp!, "resortNotes")).toEqual({ checked: false, enabled: false, label: "Re-sort notes" });
  });

  test("shows a confirmation after re-sorting from Settings", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();

    const settingsPage = await openSettings(desktopApp);
    await settingsPage.getByRole("button", { name: "Re-sort notes" }).click();

    await expect(settingsPage.getByRole("status")).toHaveText("Notes re-sorted by Date created (oldest first)");
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

async function clickSortMenuItem(desktopApp: TestElectronApp, menuItemId: string): Promise<void> {
  await desktopApp.app.evaluate(({ Menu }, id) => {
    const menuItem = Menu.getApplicationMenu()?.getMenuItemById(id);

    if (!menuItem) {
      throw new Error(`Could not find the ${id} Sort notes menu item.`);
    }

    menuItem.click(undefined as never, undefined as never, undefined as never);
  }, menuItemId);
}

async function getSortMenuItemState(desktopApp: TestElectronApp, menuItemId: string): Promise<{ checked: boolean; enabled: boolean; label: string } | undefined> {
  return desktopApp.app.evaluate(({ Menu }, id) => {
    const menuItem = Menu.getApplicationMenu()?.getMenuItemById(id);

    return menuItem
      ? { checked: menuItem.checked, enabled: menuItem.enabled, label: menuItem.label }
      : undefined;
  }, menuItemId);
}

async function getSortMenuItemStates(desktopApp: TestElectronApp): Promise<Array<{ checked: boolean; enabled: boolean; label: string }>> {
  return desktopApp.app.evaluate(({ Menu }) => {
    const sortMenu = Menu.getApplicationMenu()?.getMenuItemById("sortNotes");

    return sortMenu?.submenu?.items
      .filter((item) => item.type === "radio" && item.visible)
      .map((item) => ({ checked: item.checked, enabled: item.enabled, label: item.label })) ?? [];
  });
}
