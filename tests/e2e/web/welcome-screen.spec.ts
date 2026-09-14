/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, test } from "@playwright/test";

test.describe("Welcome screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("renders on the browser welcome route", async ({ page }) => {
    await page.goto("/welcome");

    await expect(page.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Get Started" })).toBeVisible();
  });

  test("opens the notes view after Get Started on the browser welcome route", async ({ page }) => {
    await page.goto("/welcome");

    await page.getByRole("button", { name: "Get Started" }).click();

    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText("You don't have any notes yet!")).toBeVisible();
  });

  test("skips the Welcome screen after Do not show again is selected", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("checkbox", { name: "Do not show this welcome screen again" }).check();
    await page.getByRole("button", { name: "Get Started" }).click();
    await expect(page.getByText("You don't have any notes yet!")).toBeVisible();

    await page.reload();

    await expect(page.getByText("You don't have any notes yet!")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Welcome to Axion Notes" })).not.toBeVisible();
  });
});
