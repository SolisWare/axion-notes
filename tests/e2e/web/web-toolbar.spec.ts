/**
 * Copyright (c) 2026 SolisWare and contributors.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, Page, test } from "@playwright/test";

test.describe("Web toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("toolbar flow", () => {
    test("loads the notes view with the web toolbar", async ({ page }) => {
      await openNotesView(page);

      await expect(page.getByRole("heading", { name: "Axion Notes" })).toBeVisible();
      await expect(page.getByRole("button", { name: "New note" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Select notes" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Delete All" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
    });

    test("adds a note from the web toolbar", async ({ page }) => {
      await openNotesView(page);

      await page.getByRole("button", { name: "New note" }).click();

      await expect(page.getByPlaceholder("Title")).toBeVisible();
      await expect(page.getByText("You don't have any notes yet!")).not.toBeVisible();
    });

    test("enters note selection mode from the web toolbar", async ({ page }) => {
      await openNotesView(page);
      await addNoteFromToolbar(page);

      await page.getByRole("button", { name: "Select notes" }).click();

      await expect(page.getByRole("toolbar", { name: "Note selection actions" })).toBeVisible();
    });

    test("deletes all notes from the web toolbar", async ({ page }) => {
      await openNotesView(page);
      await addNoteFromToolbar(page);

      await page.getByRole("button", { name: "Delete All" }).click();
      await expect(page.getByRole("heading", { name: "Delete All Notes" })).toBeVisible();
      await page.getByRole("button", { name: "Delete All" }).click();

      await expect(page.getByText("You don't have any notes yet!")).toBeVisible();
    });

    test("opens settings from the web toolbar", async ({ page }) => {
      await openNotesView(page);

      await page.getByRole("button", { name: "Settings" }).click();

      await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
      await expect(page.getByText("Preferences")).toBeVisible();
      await expect(page.getByText("General").first()).toBeVisible();
    });
  });

  test.describe("state transitions", () => {
    test("starts with Select notes and Delete All disabled when there are no notes", async ({ page }) => {
      await openNotesView(page);

      await expect(page.getByRole("button", { name: "New note" })).toBeEnabled();
      await expect(page.getByRole("button", { name: "Select notes" })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Delete All" })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Settings" })).toBeEnabled();
    });

    test("enables Select notes and Delete All after adding a note", async ({ page }) => {
      await openNotesView(page);

      await addNoteFromToolbar(page);

      await expect(page.getByRole("button", { name: "Select notes" })).toBeEnabled();
      await expect(page.getByRole("button", { name: "Delete All" })).toBeEnabled();
    });

    test("disables Select notes and Delete All again after deleting every note", async ({ page }) => {
      await openNotesView(page);
      await addNoteFromToolbar(page);

      await deleteAllNotesFromToolbar(page);

      await expect(page.getByText("You don't have any notes yet!")).toBeVisible();
      await expect(page.getByRole("button", { name: "Select notes" })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Delete All" })).toBeDisabled();
    });

    test("returns to the normal toolbar after canceling note selection", async ({ page }) => {
      await openNotesView(page);
      await addNoteFromToolbar(page);

      await page.getByRole("button", { name: "Select notes" }).click();
      await expect(page.getByRole("toolbar", { name: "Note selection actions" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Select notes" })).toBeDisabled();

      await page.getByRole("button", { name: "Cancel" }).click();

      await expect(page.getByRole("toolbar", { name: "Note selection actions" })).not.toBeVisible();
      await expect(page.getByRole("button", { name: "Select notes" })).toBeEnabled();
      await expect(page.getByRole("button", { name: "Delete All" })).toBeEnabled();
    });
  });
});

async function openNotesView(page: Page) {
  await page.goto("/welcome");
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByText("You don't have any notes yet!")).toBeVisible();
}

async function addNoteFromToolbar(page: Page) {
  await page.getByRole("button", { name: "New note" }).click();
  await expect(page.getByPlaceholder("Title")).toBeVisible();
}

async function deleteAllNotesFromToolbar(page: Page) {
  await page.getByRole("button", { name: "Delete All" }).click();
  await expect(page.getByRole("heading", { name: "Delete All Notes" })).toBeVisible();
  await page.getByRole("button", { name: "Delete All" }).click();
}
