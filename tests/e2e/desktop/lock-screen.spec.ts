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

test.describe("Lock screen", () => {
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

  test("expands the localized Unlock button without overflowing its content", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.evaluate(async () => {
      const settings = await window.api.settings.getSettings();

      if (!settings) {
        throw new Error("Could not load application settings.");
      }

      window.api.settings.setSettings({
        ...settings,
        language: "pl",
        lockScreenEnabled: true
      });
    });
    await expect.poll(async () => desktopApp!.page.evaluate(async () => {
      return (await window.api.settings.getSettings())?.language;
    })).toBe("pl");

    await expect(desktopApp.page.evaluate(async () => {
      return await window.api.security.setPassword("test password");
    })).resolves.toBe(true);
    await expect(desktopApp.page.evaluate(async () => {
      return await window.api.security.lock();
    })).resolves.toBe(true);

    await desktopApp.close();
    desktopApp = await launchTestElectronApp(userDataDir);

    const unlockButton = desktopApp.page.getByRole("button", { name: "Odblokuj notatki" });
    await expect(unlockButton).toBeVisible();

    const layout = await unlockButton.evaluate((button) => {
      const content = button.querySelector("span");

      if (!(content instanceof HTMLElement)) {
        throw new Error("Could not find the Unlock button content.");
      }

      const buttonBounds = button.getBoundingClientRect();
      const contentBounds = content.getBoundingClientRect();

      return {
        buttonWidth: buttonBounds.width,
        contentFits: contentBounds.left >= buttonBounds.left && contentBounds.right <= buttonBounds.right,
        hasHorizontalOverflow: button.scrollWidth > button.clientWidth,
        whiteSpace: window.getComputedStyle(button).whiteSpace
      };
    });

    expect(layout.buttonWidth).toBeGreaterThan(164);
    expect(layout.contentFits).toBe(true);
    expect(layout.hasHorizontalOverflow).toBe(false);
    expect(layout.whiteSpace).toBe("nowrap");
  });
});
