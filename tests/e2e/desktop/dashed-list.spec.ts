/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, Locator, Page, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

test.describe("Dashed lists", () => {
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

  test("applies and preserves dashed-list formatting after reopening a note window", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await addNote(desktopApp);

    const mainEditor = desktopApp.page.locator(".ProseMirror");
    await expect(mainEditor).toBeVisible();
    await mainEditor.fill("Dashed item");
    const noteId = await getNoteId(desktopApp.page, "Dashed item");
    const noteWindow = await openNoteWindow(desktopApp, noteId);
    const noteEditor = noteWindow.locator(".ProseMirror");

    await expect(noteEditor).toBeVisible();
    await selectAllEditorText(noteWindow, noteEditor);
    await applyDashedListFromNativeMenu(desktopApp);
    await expect(noteEditor.locator("ul[data-list-marker-type='dash']")).toContainText("Dashed item");

    await closeNoteWindow(noteWindow);
    const reopenedNoteWindow = await openNoteWindow(desktopApp, noteId);

    await expect(reopenedNoteWindow.locator(".ProseMirror ul[data-list-marker-type='dash']")).toContainText("Dashed item");
  });
});

async function addNote(desktopApp: TestElectronApp): Promise<void> {
  await desktopApp.app.evaluate(({ Menu }) => {
    const newNoteMenuItem = Menu.getApplicationMenu()?.getMenuItemById("newNote");

    if (!newNoteMenuItem) {
      throw new Error("Could not find the New note menu item.");
    }

    newNoteMenuItem.click(undefined as never, undefined as never, undefined as never);
  });
}

async function closeNoteWindow(noteWindow: Page): Promise<void> {
  const closed = noteWindow.waitForEvent("close");
  await noteWindow.evaluate(() => window.api.appWindow.close());
  await closed;
}

async function applyDashedListFromNativeMenu(desktopApp: TestElectronApp): Promise<void> {
  await expect.poll(() => desktopApp.app.evaluate(({ Menu }) => {
    return Menu.getApplicationMenu()?.getMenuItemById("formatDashedList")?.enabled ?? false;
  })).toBe(true);

  await desktopApp.app.evaluate(({ Menu }) => {
    const dashedListMenuItem = Menu.getApplicationMenu()?.getMenuItemById("formatDashedList");

    if (!dashedListMenuItem) {
      throw new Error("Could not find the Dashed list menu item.");
    }

    dashedListMenuItem.click(undefined as never, undefined as never, undefined as never);
  });
}

async function getNoteId(page: Page, content: string): Promise<string> {
  await expect.poll(async () => page.evaluate(async (noteContent) => {
    const notes = await window.api.storage.getNotes();
    return notes.find((note) => note.content === noteContent)?.id;
  }, content)).not.toBeUndefined();

  return page.evaluate(async (noteContent) => {
    const notes = await window.api.storage.getNotes();
    const noteId = notes.find((note) => note.content === noteContent)?.id;

    if (!noteId) {
      throw new Error("Could not find the saved note.");
    }

    return noteId;
  }, content);
}

async function openNoteWindow(desktopApp: TestElectronApp, noteId: string): Promise<Page> {
  const noteWindowPromise = desktopApp.app.waitForEvent("window");
  await desktopApp.page.evaluate((id) => window.api.noteWindow.open(id), noteId);
  const noteWindow = await noteWindowPromise;

  await noteWindow.waitForLoadState("domcontentloaded");
  return noteWindow;
}

async function selectAllEditorText(page: Page, editor: Locator): Promise<void> {
  await editor.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
}
