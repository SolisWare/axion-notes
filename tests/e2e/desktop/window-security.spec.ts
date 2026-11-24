/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

test.describe("Window security", () => {
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

  test("denies external popups while handing safe links to the shell", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;
    const originalUrl = desktopApp.page.url();

    await desktopApp.app.evaluate(({ shell }) => {
      (globalThis as typeof globalThis & { openedExternalUrls?: string[] }).openedExternalUrls = [];
      shell.openExternal = async (url: string) => {
        (globalThis as typeof globalThis & { openedExternalUrls?: string[] }).openedExternalUrls?.push(url);
      };
    });

    await desktopApp.page.evaluate(() => window.open("https://example.com/popup"));
    await expect.poll(() => getOpenedExternalUrls(desktopApp!)).toEqual(["https://example.com/popup"]);
    expect(desktopApp.app.windows()).toHaveLength(1);
    await expect(desktopApp.page).toHaveURL(originalUrl);

  });
});

async function getOpenedExternalUrls(desktopApp: TestElectronApp): Promise<string[]> {
  return desktopApp.app.evaluate(() => {
    return (globalThis as typeof globalThis & { openedExternalUrls?: string[] }).openedExternalUrls ?? [];
  });
}
