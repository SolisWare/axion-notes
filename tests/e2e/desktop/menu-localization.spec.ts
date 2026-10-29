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

test.describe("Native menu localization", () => {
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

  test("rebuilds role labels when the application language changes", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.evaluate(async () => {
      const settings = await window.api.settings.getSettings();

      if (!settings) {
        throw new Error("Could not load application settings.");
      }

      await window.api.settings.setSettings({
        ...settings,
        language: "es"
      });
    });

    await expect.poll(() => getMenuItemLabelByRole(desktopApp!, "close")).toBe("Cerrar");
  });
});

async function getMenuItemLabelByRole(desktopApp: TestElectronApp, role: string): Promise<string | undefined> {
  return desktopApp.app.evaluate(({ Menu }, targetRole) => {
    function findMenuItem(menu: Electron.Menu, roleToFind: string): Electron.MenuItem | undefined {
      for (const menuItem of menu.items) {
        if (menuItem.role === roleToFind) {
          return menuItem;
        }

        if (menuItem.submenu) {
          const nestedMenuItem = findMenuItem(menuItem.submenu, roleToFind);

          if (nestedMenuItem) {
            return nestedMenuItem;
          }
        }
      }

      return undefined;
    }

    const applicationMenu = Menu.getApplicationMenu();
    return applicationMenu ? findMenuItem(applicationMenu, targetRole)?.label : undefined;
  }, role);
}
