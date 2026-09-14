/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ElectronApplication, Page, _electron as electron } from "@playwright/test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const electronExecutablePath = require("electron") as string;
const splashWindowFileName = "/splash.html";

export type TestElectronApp = {
  app: ElectronApplication;
  page: Page;
  userDataDir: string;
  close: () => Promise<void>;
};

export async function launchTestElectronApp(userDataDir?: string): Promise<TestElectronApp> {
  const resolvedUserDataDir = userDataDir ?? await fs.mkdtemp(path.join(os.tmpdir(), "axion-notes-e2e-"));
  const {
    ELECTRON_RUN_AS_NODE: _electronRunAsNode,
    ...env
  } = process.env;
  const app = await electron.launch({
    args: [
      path.join(process.cwd(), "build/electron/electron.js")
    ],
    executablePath: electronExecutablePath,
    env: {
      ...env,
      AXION_NOTES_E2E_USER_DATA_DIR: resolvedUserDataDir,
      ELECTRON_IS_DEV: "0"
    }
  });
  const page = await waitForMainWindow(app);

  return {
    app,
    page,
    userDataDir: resolvedUserDataDir,
    close: async () => {
      await app.evaluate(({ app: electronApp }) => {
        electronApp.quit();
      }).catch(() => undefined);
      await app.close().catch(() => undefined);
    }
  };
}

async function waitForMainWindow(app: ElectronApplication): Promise<Page> {
  await app.firstWindow();

  const timeoutAt = Date.now() + 15000;

  while (Date.now() < timeoutAt) {
    const mainPage = await findMainWindowPage(app);

    if (mainPage) {
      await waitForVisibleMainWindow(app);

      return mainPage;
    }

    await app.waitForEvent("window", { timeout: 250 }).catch(() => undefined);
  }

  throw new Error("Timed out waiting for Axion Notes main window.");
}

async function findMainWindowPage(app: ElectronApplication): Promise<Page | undefined> {
  for (const page of app.windows()) {
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);

    if (!page.isClosed() && !isSplashPage(page)) {
      return page;
    }
  }

  return undefined;
}

async function waitForVisibleMainWindow(app: ElectronApplication): Promise<void> {
  await app.evaluate(async ({ BrowserWindow }, fileName) => {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const mainWindow = BrowserWindow.getAllWindows().find((window) =>
          !window.isDestroyed() &&
          !window.webContents.getURL().endsWith(fileName)
        );

        if (mainWindow?.isVisible()) {
          clearInterval(interval);
          resolve();
        }
      }, 25);
    });
  }, splashWindowFileName);
}

function isSplashPage(page: Page): boolean {
  return page.url().endsWith(splashWindowFileName);
}

export async function removeTestUserDataDir(userDataDir: string): Promise<void> {
  await fs.rm(userDataDir, {
    force: true,
    recursive: true
  });
}
