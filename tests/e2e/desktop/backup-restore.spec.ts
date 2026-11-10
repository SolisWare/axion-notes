/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, Page, test } from "@playwright/test";
import path from "node:path";
import { NoteType } from "../../../src/types/NoteType";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

const backupFileName = "axion-notes-backup.zip";
const archivedNote: NoteType = {
  bgcolor: "yellow",
  content: "This note is included in the archive.",
  createdOn: new Date("2026-11-07T10:00:00.000Z"),
  id: "backup-restore-archived-note",
  lastModifiedOn: new Date("2026-11-07T10:00:00.000Z"),
  title: "Archived E2E note"
};
const laterNote: NoteType = {
  bgcolor: "blue",
  content: "This note was created after the archive.",
  createdOn: new Date("2026-11-07T11:00:00.000Z"),
  id: "backup-restore-later-note",
  lastModifiedOn: new Date("2026-11-07T11:00:00.000Z"),
  title: "Later E2E note"
};

test.describe("Backup restore", () => {
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

  test("replaces later notes with the selected managed backup", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await setNote(desktopApp.page, archivedNote);
    await expectNotes(desktopApp.page, [archivedNote]);

    const settingsPage = await openSettings(desktopApp);
    await settingsPage.getByRole("button", { name: "Backups" }).click();
    await settingsPage.getByRole("button", { name: "Set up backups" }).click();
    await settingsPage.getByRole("button", { name: "Create backup" }).click();
    await expect(settingsPage.getByRole("status")).toHaveText("Backup created");

    await setNote(desktopApp.page, laterNote);
    await expectNotes(desktopApp.page, [archivedNote, laterNote]);

    const archivePath = path.join(userDataDir, "backup", backupFileName);
    await configureRestoreArchive(desktopApp, archivePath);
    await preventRestartForInspection(desktopApp);

    await settingsPage.getByRole("button", { name: "Restore backup…" }).click();

    const reviewDialog = await settingsPage.getByRole("dialog", { name: "Restore backup…" });
    await expect(reviewDialog.getByRole("radio", { name: "Add backup notes" })).toBeChecked();
    await expect(reviewDialog.getByRole("radio", { name: "Restore backup preferences" })).toBeChecked();
    await expect(reviewDialog.getByRole("button", { name: "Restore backup…" })).toBeEnabled();
    await reviewDialog.getByRole("radio", { name: "Replace current notes" }).check();
    await reviewDialog.getByRole("radio", { name: "Restore backup preferences" }).check();
    await reviewDialog.getByRole("button", { name: "Restore backup…" }).click();

    const confirmationDialog = await settingsPage.getByRole("dialog", { name: "Restore backup…" });
    await confirmationDialog.getByRole("button", { name: "Restore backup…" }).click();

    await expectNotes(desktopApp.page, [archivedNote]);
    await expect.poll(() => settingsPage.evaluate(async () => window.api.restore.getState())).toMatchObject({
      lastRestoredAt: expect.any(String),
      version: 1
    });
  });

  test("skips merge choices when the selected backup already matches the app", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await setNote(desktopApp.page, archivedNote);

    const settingsPage = await openSettings(desktopApp);
    await settingsPage.getByRole("button", { name: "Backups" }).click();
    await settingsPage.getByRole("button", { name: "Set up backups" }).click();
    await settingsPage.getByRole("button", { name: "Create backup" }).click();
    await expect(settingsPage.getByRole("status")).toHaveText("Backup created");

    await configureRestoreArchive(desktopApp, path.join(userDataDir, "backup", backupFileName));
    await preventRestartForInspection(desktopApp);
    await settingsPage.getByRole("button", { name: "Restore backup…" }).click();

    const confirmationDialog = await settingsPage.getByRole("dialog", { name: "Restore backup…" });
    await expect(confirmationDialog).toHaveAccessibleDescription("This replaces data according to the selected restore options. Axion Notes will restart when the restore is complete.");
    await expect(settingsPage.getByText("This backup contains 1 notes.")).toHaveCount(0);
    await confirmationDialog.getByRole("button", { name: "Restore backup…" }).click();

    await expectNotes(desktopApp.page, [archivedNote]);
  });

  test("adds a distinct copy when a backup note conflicts with a current note", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await setNote(desktopApp.page, archivedNote);

    const settingsPage = await openSettings(desktopApp);
    await settingsPage.getByRole("button", { name: "Backups" }).click();
    await settingsPage.getByRole("button", { name: "Set up backups" }).click();
    await settingsPage.getByRole("button", { name: "Create backup" }).click();
    await expect(settingsPage.getByRole("status")).toHaveText("Backup created");

    await setNote(desktopApp.page, { ...archivedNote, content: "This is the current version of the note." });
    await configureRestoreArchive(desktopApp, path.join(userDataDir, "backup", backupFileName));
    await preventRestartForInspection(desktopApp);
    await settingsPage.getByRole("button", { name: "Restore backup…" }).click();

    const reviewDialog = await settingsPage.getByRole("dialog", { name: "Restore backup…" });
    await expect(reviewDialog.getByRole("radio", { name: "Add backup notes" })).toBeChecked();
    await reviewDialog.getByRole("button", { name: "Restore backup…" }).click();
    await settingsPage.getByRole("dialog", { name: "Restore backup…" }).getByRole("button", { name: "Restore backup…" }).click();

    await expect.poll(async () => getStoredNotes(desktopApp!.page)).toEqual(expect.arrayContaining([
      expect.objectContaining({ content: archivedNote.content, title: archivedNote.title }),
      expect.objectContaining({ content: "This is the current version of the note.", id: archivedNote.id, title: archivedNote.title })
    ]));
    await expect.poll(async () => (await getStoredNotes(desktopApp!.page)).length).toBe(2);
  });
});

async function setNote(page: Page, note: NoteType): Promise<void> {
  await page.evaluate((noteToSave) => {
    window.api.storage.setNote(noteToSave);
  }, note);
}

async function expectNotes(page: Page, expectedNotes: NoteType[]): Promise<void> {
  await expect.poll(async () => getStoredNotes(page)).toEqual(expectedNotes.map((note) => ({
    content: note.content,
    id: note.id,
    title: note.title
  })));
}

async function getStoredNotes(page: Page): Promise<Array<Pick<NoteType, "content" | "id" | "title">>> {
  return page.evaluate(async () => (await window.api.storage.getNotes()).map((note) => ({
    content: note.content,
    id: note.id,
    title: note.title
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

async function configureRestoreArchive(desktopApp: TestElectronApp, archivePath: string): Promise<void> {
  await desktopApp.app.evaluate(({ dialog }, selectedArchivePath) => {
    dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [selectedArchivePath]
    }) as never;
  }, archivePath);
}

async function preventRestartForInspection(desktopApp: TestElectronApp): Promise<void> {
  await desktopApp.app.evaluate(({ app }) => {
    app.exit = () => undefined;
    app.relaunch = () => undefined;
  });
}
