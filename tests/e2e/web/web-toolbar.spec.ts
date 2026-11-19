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

    test("keeps notes when Delete All is cancelled", async ({ page }) => {
      await openNotesView(page);
      await addNoteFromToolbar(page);

      await page.getByRole("button", { name: "Delete All" }).click();

      const confirmationDialog = page.getByRole("dialog", { name: "Delete All Notes" });
      await expect(confirmationDialog).toHaveAccessibleDescription("Are you sure you want to delete all notes? This action cannot be undone.");

      await page.getByRole("button", { name: "Cancel" }).click();

      await expect(confirmationDialog).not.toBeVisible();
      await expect(page.getByPlaceholder("Title")).toBeVisible();
      await expect(page.getByText("You don't have any notes yet!")).not.toBeVisible();
      await expect(page.getByRole("button", { name: "Delete All" })).toBeEnabled();
    });

    test("opens settings from the web toolbar", async ({ page }) => {
      await openNotesView(page);

      await page.getByRole("button", { name: "Settings" }).click();

      await expect(page.getByRole("button", { name: "Close" })).toBeVisible();
      await expect(page.getByText("Preferences")).toBeVisible();
      await expect(page.getByText("General").first()).toBeVisible();
    });

    test("opens About from web Settings", async ({ page }) => {
      await openNotesView(page);

      await page.getByRole("button", { name: "Settings" }).click();
      await page.getByRole("button", { name: "About" }).click();

      await expect(page.getByRole("heading", { name: "About", exact: true })).toBeVisible();
      await expect(page.getByText(/^Version \d+\.\d+\.\d+(?:-[\w.-]+)?(?: \([^)]+\))?$/)).toBeVisible();
      await expect(page.getByText(/Copyright © 2023-\d{4} SolisWare\./)).toBeVisible();
      await expect(page.getByText("All rights reserved.")).toBeVisible();
    });

    test("applies appearance preferences from web Settings", async ({ page }) => {
      await openNotesView(page);

      await page.getByRole("button", { name: "Settings" }).click();
      await page.getByRole("button", { name: "Appearance" }).click();

      await expect(page.getByRole("heading", { name: "Appearance", exact: true })).toBeVisible();

      const darkTheme = page.getByRole("radio", { name: "Dark" });
      await darkTheme.check({ force: true });
      await expect(darkTheme).toBeChecked();

      const greenNoteColor = page.getByRole("radio", { name: "Green" });
      await greenNoteColor.check({ force: true });
      await expect(greenNoteColor).toBeChecked();

      const showTitles = page.getByRole("checkbox", { name: "Show note titles" });
      await showTitles.uncheck({ force: true });
      await expect(showTitles).not.toBeChecked();

      const dragAndDropSorting = page.getByRole("checkbox", { name: "Allow drag-and-drop note sorting" });
      await dragAndDropSorting.uncheck({ force: true });
      await expect(dragAndDropSorting).not.toBeChecked();

      await page.getByRole("button", { name: "Close" }).click();
      await page.getByRole("button", { name: "New note" }).click();
      await expect(page.locator("div[class*='noteDragIndicatorRow']")).toBeHidden();
    });

    test("persists disabled manual sorting and prevents notes from being reordered", async ({ page }) => {
      await openNotesView(page);
      await addNoteFromToolbar(page);
      await page.getByPlaceholder("Title").fill("First note");
      await addNoteFromToolbar(page);
      await page.getByPlaceholder("Title").first().fill("Second note");

      await page.getByRole("button", { name: "Settings" }).click();
      await page.getByRole("button", { name: "Appearance" }).click();
      await page.getByRole("checkbox", { name: "Allow drag-and-drop note sorting" }).uncheck({ force: true });
      await page.getByRole("button", { name: "Close" }).click();

      const titles = page.getByPlaceholder("Title");
      await expect(titles).toHaveCount(2);
      const firstNote = titles.nth(0).locator("xpath=ancestor::div[contains(@class, 'MuiPaper-root')]");
      const secondNote = titles.nth(1).locator("xpath=ancestor::div[contains(@class, 'MuiPaper-root')]");
      const firstBox = await firstNote.boundingBox();
      const secondBox = await secondNote.boundingBox();

      if (!firstBox || !secondBox) {
        throw new Error("Could not measure the notes.");
      }

      await page.mouse.move(firstBox.x + 12, firstBox.y + 12);
      await page.mouse.down();
      await page.mouse.move(secondBox.x + 12, secondBox.y + 12, { steps: 8 });
      await page.mouse.up();

      await expect(titles.nth(0)).toHaveValue("Second note");
      await expect(titles.nth(1)).toHaveValue("First note");

      await page.reload();
      await page.getByRole("button", { name: "Settings" }).click();
      await page.getByRole("button", { name: "Appearance" }).click();
      await expect(page.getByRole("checkbox", { name: "Allow drag-and-drop note sorting" })).not.toBeChecked();
    });

    test("applies editor preferences and confirms before disabling rich text", async ({ page }) => {
      await openNotesView(page);

      await page.getByRole("button", { name: "Settings" }).click();
      await page.getByRole("button", { name: "Editor" }).click();

      const titleFont = page.getByRole("combobox", { name: "Title font", exact: true });
      await titleFont.selectOption("lora");
      await expect(titleFont).toHaveValue("lora");

      const contentFontSize = page.getByRole("combobox", { name: "Content font size", exact: true });
      await contentFontSize.selectOption("20");
      await expect(contentFontSize).toHaveValue("20");

      await page.getByRole("checkbox", { name: "Rich Text Editor" }).click({ force: true });
      const confirmationDialog = page.getByRole("dialog", { name: "Turn Off Rich Text Editor?" });
      await expect(confirmationDialog).toBeVisible();
      await confirmationDialog.getByRole("button", { name: "Cancel" }).click();
      await expect(confirmationDialog).not.toBeVisible();
      await expect(page.getByRole("checkbox", { name: "Rich Text Editor" })).toBeChecked();
    });

    test("navigates every web Settings page", async ({ page }) => {
      await openNotesView(page);
      await page.getByRole("button", { name: "Settings" }).click();

      for (const pageName of ["Appearance", "Editor", "Data & storage", "Backups", "License", "Links", "About"]) {
        const pageButton = page.getByRole("button", { name: pageName, exact: true });
        await pageButton.click();

        await expect(page.getByRole("heading", { level: 1, name: pageName })).toBeVisible();
        await expect(pageButton).toHaveAttribute("aria-current", "page");
      }
    });

    test("shows the applied sort order after re-sorting from Settings", async ({ page }) => {
      await openNotesView(page);

      await page.getByRole("button", { name: "Settings" }).click();
      await page.getByRole("button", { name: "Re-sort notes" }).click();

      await expect(page.getByRole("status")).toHaveText("Notes re-sorted by Date created (oldest first)");
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
  await expect(page.getByPlaceholder("Title").last()).toBeVisible();
}

async function deleteAllNotesFromToolbar(page: Page) {
  await page.getByRole("button", { name: "Delete All" }).click();
  await expect(page.getByRole("heading", { name: "Delete All Notes" })).toBeVisible();
  await page.getByRole("button", { name: "Delete All" }).click();
}
