/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, Page, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

const password = "V7$kQ2!xLp9#Nz4";
const noteTitle = "Encrypted E2E note";
const noteContent = "Private E2E content that must survive encryption.";

test.describe("Note encryption", () => {
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

  test("encrypts a note, requires its password after restart, and restores it without data loss", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await addNote(desktopApp.page);
    await expectNotes(desktopApp.page, [noteTitle]);

    const settingsPage = await openSettings(desktopApp);
    await configureLockPassword(settingsPage);
    await enableEncryption(settingsPage);
    await expect.poll(async () => desktopApp!.page.evaluate(async () => {
      return (await window.api.settings.getSettings())?.notesEncryptionEnabled;
    })).toBe(true);

    await desktopApp.close();
    desktopApp = await launchTestElectronApp(userDataDir);

    await expect(desktopApp.page.getByRole("heading", { name: "Your notes are locked" })).toBeVisible();
    await desktopApp.page.locator("#unlock-password").fill("wrong password");
    await desktopApp.page.getByRole("button", { name: "Unlock notes" }).click();
    await expect(desktopApp.page.getByText("The password is incorrect.")).toBeVisible();
    await expectNotes(desktopApp.page, []);

    await desktopApp.page.locator("#unlock-password").fill(password);
    await desktopApp.page.getByRole("button", { name: "Unlock notes" }).click();
    await expectNotes(desktopApp.page, [noteTitle]);
  });
});

async function addNote(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.api.storage.setNote({
      id: "encrypted-e2e-note",
      bgcolor: "yellow",
      title: "Encrypted E2E note",
      content: "Private E2E content that must survive encryption.",
      createdOn: new Date("2026-10-30T12:00:00.000Z"),
      lastModifiedOn: new Date("2026-10-30T12:00:00.000Z")
    });
  });
}

async function configureLockPassword(settingsPage: Page): Promise<void> {
  await settingsPage.getByRole("button", { name: "Security" }).click();
  await settingsPage.locator('label:has(input[aria-labelledby="lock-screen-enabled-title"])').click();
  await expect(settingsPage.getByRole("dialog", { name: "Set lock password" })).toBeVisible();
  await settingsPage.getByLabel("New password").fill(password);
  await settingsPage.getByLabel("Confirm password").fill(password);
  await settingsPage.getByRole("button", { name: "Set password" }).click();
  await expect(settingsPage.getByRole("dialog", { name: "Set lock password" })).not.toBeVisible();
}

async function enableEncryption(settingsPage: Page): Promise<void> {
  await settingsPage.locator('label:has(input[aria-labelledby="notes-encryption-enabled-title"])').click();
  await expect(settingsPage.getByRole("dialog", { name: "Enable Note Encryption?" })).toBeVisible();
  await settingsPage.getByRole("button", { name: "Enable" }).click();
  await expect(settingsPage.getByRole("dialog", { name: "Enable note encryption" })).toBeVisible();
  await settingsPage.getByLabel("Current password").fill(password);
  await settingsPage.getByRole("button", { name: "Encrypt notes" }).click();
  await expect(settingsPage.getByRole("dialog", { name: "Enable note encryption" })).not.toBeVisible();
}

async function expectNotes(page: Page, expectedTitles: string[]): Promise<void> {
  await expect.poll(async () => page.evaluate(async () => {
    return (await window.api.storage.getNotes()).map((note) => ({
      title: note.title,
      content: note.content
    }));
  })).toEqual(expectedTitles.map((title) => ({
    title,
    content: noteContent
  })));
}

async function openSettings(desktopApp: TestElectronApp): Promise<Page> {
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
