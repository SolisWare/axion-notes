/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, Page, test } from "@playwright/test";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

const note = {
  bgcolor: "yellow",
  content: "Initial note-window content",
  createdOn: new Date("2026-11-27T12:00:00.000Z"),
  id: "note-window-e2e",
  lastModifiedOn: new Date("2026-11-27T12:00:00.000Z"),
  title: "Dedicated note window"
};

test.describe("Note window", () => {
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

  test("opens one dedicated window per note, synchronizes edits, and creates a replacement after close", async () => {
    desktopApp = await launchTestElectronApp();
    userDataDir = desktopApp.userDataDir;

    await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
    await desktopApp.page.evaluate(async (noteToSave) => {
      await window.api.storage.setNote(noteToSave);
    }, note);
    await desktopApp.page.reload();
    await expect(desktopApp.page.getByPlaceholder("Title")).toHaveValue(note.title);

    const noteWindow = await openNoteWindow(desktopApp, note.id);
    await expect(noteWindow.getByPlaceholder("Title")).toHaveValue(note.title);
    await expect(noteWindow.locator(".ProseMirror")).toHaveText(note.content);

    await noteWindow.getByPlaceholder("Title").fill("Updated in dedicated window");
    await expect(desktopApp.page.getByPlaceholder("Title")).toHaveValue("Updated in dedicated window");

    await desktopApp.page.evaluate((noteId) => window.api.noteWindow.open(noteId), note.id);
    await expect.poll(() => getOpenNoteWindowCount(desktopApp!)).toBe(1);

    await closeNoteWindow(noteWindow);
    await expect.poll(() => getOpenNoteWindowCount(desktopApp!)).toBe(0);

    const replacementWindow = await openNoteWindow(desktopApp, note.id);
    await expect(replacementWindow.getByPlaceholder("Title")).toHaveValue("Updated in dedicated window");
  });
});

async function openNoteWindow(desktopApp: TestElectronApp, noteId: string): Promise<Page> {
  const noteWindowPromise = desktopApp.app.waitForEvent("window");
  await desktopApp.page.evaluate((id) => window.api.noteWindow.open(id), noteId);
  const noteWindow = await noteWindowPromise;

  await noteWindow.waitForLoadState("domcontentloaded");
  return noteWindow;
}

async function closeNoteWindow(noteWindow: Page): Promise<void> {
  const closed = noteWindow.waitForEvent("close");
  await noteWindow.evaluate(() => window.api.appWindow.close());
  await closed;
}

async function getOpenNoteWindowCount(desktopApp: TestElectronApp): Promise<number> {
  return desktopApp.app.evaluate(({ BrowserWindow }) => {
    return BrowserWindow.getAllWindows().filter((window) => {
      return !window.isDestroyed() && window.webContents.getURL().includes("#/note");
    }).length;
  });
}
