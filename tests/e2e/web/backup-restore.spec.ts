/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, Page, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

test.describe("Web backup restore", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("replaces current notes from a selected backup archive", async ({ page }) => {
    await openNotesView(page);
    await page.getByRole("button", { name: "New note" }).click();
    await page.getByPlaceholder("Title").fill("Current note");
    await page.locator(".ProseMirror").fill("Current content");

    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Backups" }).click();

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Restore backup…" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      buffer: createBackupArchive(),
      mimeType: "application/zip",
      name: "axion-notes-backup.zip"
    });

    const restoreDialog = page.getByRole("dialog", { name: "Restore backup…" });
    await expect(restoreDialog).toBeVisible();
    await expect(restoreDialog.getByText("This backup contains 1 notes.")).toBeVisible();
    await restoreDialog.getByRole("radio", { name: "Replace current notes" }).check();
    await restoreDialog.getByRole("button", { name: "Restore backup…" }).click();

    const confirmationDialog = page.getByRole("dialog", { name: "Restore backup…" });
    await expect(confirmationDialog).toHaveAccessibleDescription("This replaces data according to the selected restore options. Axion Notes will restart when the restore is complete.");
    await confirmationDialog.getByRole("button", { name: "Restore backup…" }).click();

    await expect(page.getByPlaceholder("Title")).toHaveValue("Restored note");
    await expect(page.locator(".ProseMirror")).toHaveText("Restored content");
    await expect(page.getByText("Current note")).not.toBeVisible();
  });
});

function createBackupArchive(): Buffer {
  const files = {
    "manifest.json": strToU8(JSON.stringify({
      version: 1,
      createdAt: "2026-11-07T12:00:00.000Z",
      contentSelection: { appSettings: false, mainWindowState: false }
    })),
    "notes.json": strToU8(JSON.stringify([{
      bgcolor: "yellow",
      content: "Restored content",
      createdOn: "2026-11-07T10:00:00.000Z",
      id: "restored-note",
      lastModifiedOn: "2026-11-07T11:00:00.000Z",
      title: "Restored note"
    }])),
    "note-order.json": strToU8(JSON.stringify(["restored-note"]))
  };

  return Buffer.from(zipSync(files));
}

async function openNotesView(page: Page): Promise<void> {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("You don't have any notes yet!")).toBeVisible();
}
