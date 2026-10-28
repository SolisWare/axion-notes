/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import { expect, Locator, Page, test } from "@playwright/test";

test.describe("Note format toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("applies bold formatting and preserves it after reload", async ({ page }) => {
    await openNoteEditor(page);
    const editor = page.locator(".ProseMirror");

    await editor.fill("Axion Notes");
    await selectAllEditorText(page, editor);
    await page.getByRole("button", { name: "Format", exact: true }).click();
    await page.getByRole("button", { name: "Bold" }).click();
    await expect(editor.locator("strong")).toHaveText("Axion Notes");

    await page.reload();

    await expect(page.locator(".ProseMirror strong")).toHaveText("Axion Notes");
  });

  test("applies a selected font size and preserves it after reload", async ({ page }) => {
    await openNoteEditor(page);
    const editor = page.locator(".ProseMirror");

    await editor.fill("Axion Notes");
    await selectAllEditorText(page, editor);
    await page.getByRole("button", { name: "Font size" }).click();
    await page.getByRole("menuitem", { name: "20" }).click();
    await expect(editor.locator("span[style*='20px']")).toHaveText("Axion Notes");

    await page.reload();

    await expect(page.locator(".ProseMirror span[style*='20px']")).toHaveText("Axion Notes");
  });

  test("shows and persists the active dashed-list format", async ({ page }) => {
    await openNoteEditor(page);
    const editor = page.locator(".ProseMirror");

    await editor.fill("Dashed item");
    await selectAllEditorText(page, editor);
    await page.getByRole("button", { name: "Lists" }).click();
    await page.getByRole("button", { name: "Dashed list" }).click();

    await expect(editor.locator("ul[data-list-marker-type='dash']")).toContainText("Dashed item");
    await expect(page.getByRole("button", { name: "Lists" })).toHaveAttribute("aria-pressed", "true");

    await page.reload();

    await expect(page.locator(".ProseMirror ul[data-list-marker-type='dash']")).toContainText("Dashed item");
  });
});

async function openNoteEditor(page: Page): Promise<void> {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Get Started" }).click();
  await page.getByRole("button", { name: "New note" }).click();
  await expect(page.locator(".ProseMirror")).toBeVisible();
}

async function selectAllEditorText(page: Page, editor: Locator): Promise<void> {
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
}
