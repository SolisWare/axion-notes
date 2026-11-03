/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, Page, test } from "@playwright/test";

const noteTitle = "Web note window";
const initialContent = "Initial note content";
const updatedContent = "Updated in the web note window";

test.describe("Web note window dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("opens a note in a named dialog, saves edits, and returns to the notes board", async ({ page }) => {
    await openNotesView(page);
    await page.getByRole("button", { name: "New note" }).click();
    await page.getByPlaceholder("Title").fill(noteTitle);
    await page.locator(".ProseMirror").fill(initialContent);

    const note = page.getByPlaceholder("Title").locator("xpath=ancestor::div[contains(@class, 'MuiPaper-root')]");
    await note.click({ button: "right" });
    await expect(page.locator("[data-note-context-menu='true']")).toBeVisible();
    await page.getByText("Open in new window", { exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Note" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder("Title")).toHaveValue(noteTitle);

    const dialogEditor = dialog.locator(".ProseMirror");
    await expect(dialogEditor).toHaveText(initialContent);
    await dialogEditor.fill(updatedContent);
    await dialog.getByRole("button", { name: "Close" }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.locator(".ProseMirror")).toHaveText(updatedContent);

    await page.reload();

    await expect(page.getByPlaceholder("Title")).toHaveValue(noteTitle);
    await expect(page.locator(".ProseMirror")).toHaveText(updatedContent);
  });
});

async function openNotesView(page: Page): Promise<void> {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("You don't have any notes yet!")).toBeVisible();
}
