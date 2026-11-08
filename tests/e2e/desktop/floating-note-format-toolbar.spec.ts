/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, Locator, Page, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

test.describe("Floating note format toolbar", () => {
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

  test("shows the floating toolbar for an active note editor and applies compact formatting", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await expect(desktopApp.page.getByText("You don't have any notes yet!")).toBeVisible();
    await desktopApp.page.evaluate(async () => {
      await window.api.storage.setNote({
        id: "floating-toolbar-note",
        bgcolor: "yellow",
        content: "",
        createdOn: new Date("2026-11-07T12:00:00.000Z"),
        lastModifiedOn: new Date("2026-11-07T12:00:00.000Z")
      });
    });
    await desktopApp.page.reload();

    const editor = desktopApp.page.locator(".ProseMirror");
    await expect(editor).toBeVisible();
    await editor.fill("Floating toolbar text");
    await selectAllEditorText(desktopApp.page, editor);

    const toolbar = desktopApp.page.locator("[data-note-format-toolbar='true']");
    await expect(toolbar).toHaveAttribute("data-note-format-toolbar-presentation", "default");
    await toolbar.getByRole("button", { name: "Format", exact: true }).click();
    await toolbar.getByRole("button", { name: "Bold", exact: true }).click();

    await expect(editor.locator("strong")).toHaveText("Floating toolbar text");
  });
});

async function selectAllEditorText(page: Page, editor: Locator): Promise<void> {
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
}
