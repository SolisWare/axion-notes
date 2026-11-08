/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

test.describe("Note", () => {
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

  test("saves title and rich-text edits to the desktop note store", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await desktopApp.page.evaluate(async () => {
      await window.api.storage.setNote({
        id: "note-e2e",
        bgcolor: "yellow",
        content: "Initial content",
        title: "Initial title",
        createdOn: new Date("2026-11-08T12:00:00.000Z"),
        lastModifiedOn: new Date("2026-11-08T12:00:00.000Z")
      });
    });
    await desktopApp.page.reload();

    await desktopApp.page.getByPlaceholder("Title").fill("Saved title");
    await desktopApp.page.locator(".ProseMirror").fill("Saved rich-text content");

    await expect.poll(async () => desktopApp!.page.evaluate(async () => {
      const notes = await window.api.storage.getNotes();
      const note = notes.find((candidate) => candidate.id === "note-e2e");

      return {
        content: note?.content,
        hasRichContent: note?.richContent !== undefined,
        title: note?.title
      };
    })).toEqual({
      content: "Saved rich-text content",
      hasRichContent: false,
      title: "Saved title"
    });
  });
});
