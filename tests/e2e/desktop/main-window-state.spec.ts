/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, test } from "@playwright/test";
import * as fs from "node:fs";
import path from "node:path";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

const normalBounds = { height: 640, width: 900, x: 40, y: 60 };

test.describe("Main window state", () => {
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

  test("restores normal bounds and position after a normal relaunch", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await setMainWindowBounds(desktopApp, normalBounds);
    await desktopApp.close();
    desktopApp = undefined;

    await expect(readMainWindowState(userDataDir)).resolves.toEqual({ bounds: normalBounds, isMaximized: false });

    desktopApp = await launchTestElectronApp(userDataDir);

    await expect.poll(() => getMainWindowState(desktopApp!)).toEqual({ bounds: normalBounds, isMaximized: false });
  });

});

async function setMainWindowBounds(desktopApp: TestElectronApp, bounds: typeof normalBounds): Promise<void> {
  await desktopApp.app.evaluate(({ BrowserWindow }, newBounds) => {
    const mainWindow = BrowserWindow.getAllWindows().find((window) => !window.isDestroyed() && !window.webContents.getURL().endsWith("/splash.html"));

    if (!mainWindow) {
      throw new Error("Could not find the main Axion Notes window.");
    }

    mainWindow.setBounds(newBounds);
  }, bounds);

  await expect.poll(() => getMainWindowState(desktopApp)).toEqual({ bounds, isMaximized: false });
}

async function getMainWindowState(desktopApp: TestElectronApp): Promise<{ bounds: typeof normalBounds; isMaximized: boolean }> {
  return desktopApp.app.evaluate(({ BrowserWindow }) => {
    const mainWindow = BrowserWindow.getAllWindows().find((window) => !window.isDestroyed() && !window.webContents.getURL().endsWith("/splash.html"));

    if (!mainWindow) {
      throw new Error("Could not find the main Axion Notes window.");
    }

    const bounds = mainWindow.isMaximized() ? mainWindow.getNormalBounds() : mainWindow.getBounds();

    return {
      bounds,
      isMaximized: mainWindow.isMaximized()
    };
  });
}

async function readMainWindowState(userDataDir: string): Promise<unknown> {
  const stateFilePath = path.join(userDataDir, "settings", "main-window-state.json");
  return JSON.parse(await fs.promises.readFile(stateFilePath, "utf-8"));
}
