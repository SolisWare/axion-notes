/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { expect, test } from "@playwright/test";
import { ClipboardClearDelay } from "../../../src/settings/ClipboardClearDelay";
import { NoteType } from "../../../src/types/NoteType";
import { launchTestElectronApp, removeTestUserDataDir, TestElectronApp } from "../../utils/e2e/electronApp";

const testClipboardDelayMilliseconds = 1_000;
const copiedNote: NoteType = {
  bgcolor: "yellow",
  content: "Clipboard test content",
  createdOn: new Date("2026-11-27T10:00:00.000Z"),
  id: "clipboard-privacy-note",
  lastModifiedOn: new Date("2026-11-27T10:00:00.000Z"),
  title: "Clipboard test title"
};

test.describe("Clipboard privacy", () => {
  let desktopApp: TestElectronApp | undefined;
  let userDataDir: string | undefined;

  test.afterEach(async () => {
    await clearClipboard(desktopApp);
    await desktopApp?.close();
    desktopApp = undefined;

    if (userDataDir) {
      await removeTestUserDataDir(userDataDir);
      userDataDir = undefined;
    }
  });

  test("clears copied note text after the selected delay but not before", async () => {
    desktopApp = await launchClipboardTestApp();
    userDataDir = desktopApp.userDataDir;

    await prepareCopiedNote(desktopApp);
    await selectNoteTitle(desktopApp);
    await copySelectedNote(desktopApp);

    await expect.poll(() => readClipboardText(desktopApp!)).toBe(copiedNote.title);
    await desktopApp.page.waitForTimeout(testClipboardDelayMilliseconds / 2);
    await expect.poll(() => readClipboardText(desktopApp!)).toBe(copiedNote.title);
    await desktopApp.page.waitForTimeout(testClipboardDelayMilliseconds);
    await expect.poll(() => readClipboardText(desktopApp!)).toBe("");
  });

  test("leaves newer clipboard text alone after copying a note", async () => {
    desktopApp = await launchClipboardTestApp();
    userDataDir = desktopApp.userDataDir;

    await prepareCopiedNote(desktopApp);
    await selectNoteTitle(desktopApp);
    await copySelectedNote(desktopApp);

    await expect.poll(() => readClipboardText(desktopApp!)).toBe(copiedNote.title);
    await desktopApp.app.evaluate(({ clipboard }) => clipboard.writeText("Copied somewhere else"));
    await expect.poll(() => readClipboardText(desktopApp!)).toBe("Copied somewhere else");
    await desktopApp.page.waitForTimeout(testClipboardDelayMilliseconds * 2);

    await expect.poll(() => readClipboardText(desktopApp!)).toBe("Copied somewhere else");
  });

  test("clears copied note text when Axion Notes locks", async () => {
    desktopApp = await launchClipboardTestApp();
    userDataDir = desktopApp.userDataDir;

    await prepareCopiedNote(desktopApp);
    await enableClearCopiedTextOnLock(desktopApp);
    await selectNoteTitle(desktopApp);
    await copySelectedNote(desktopApp);
    await expect.poll(() => readClipboardText(desktopApp!)).toBe(copiedNote.title);

    await expect(desktopApp.page.evaluate(async () => await window.api.security.lock())).resolves.toBe(true);

    await expect.poll(() => readClipboardText(desktopApp!)).toBe("");
  });

  test("preserves newer clipboard text when Axion Notes locks", async () => {
    desktopApp = await launchClipboardTestApp();
    userDataDir = desktopApp.userDataDir;

    await prepareCopiedNote(desktopApp);
    await enableClearCopiedTextOnLock(desktopApp);
    await selectNoteTitle(desktopApp);
    await copySelectedNote(desktopApp);
    await expect.poll(() => readClipboardText(desktopApp!)).toBe(copiedNote.title);
    await desktopApp.app.evaluate(({ clipboard }) => clipboard.writeText("Copied somewhere else"));

    await expect(desktopApp.page.evaluate(async () => await window.api.security.lock())).resolves.toBe(true);

    await expect.poll(() => readClipboardText(desktopApp!)).toBe("Copied somewhere else");
  });

  test("retains the delay preference but not a pending clipboard timer after relaunch", async () => {
    desktopApp = await launchClipboardTestApp();
    userDataDir = desktopApp.userDataDir;

    await prepareCopiedNote(desktopApp);
    await selectNoteTitle(desktopApp);
    await copySelectedNote(desktopApp);
    await expect.poll(() => readClipboardText(desktopApp!)).toBe(copiedNote.title);

    await desktopApp.close();
    desktopApp = await launchTestElectronApp(userDataDir, { clipboardClearDelayMilliseconds: testClipboardDelayMilliseconds });

    await expect.poll(async () => (await desktopApp!.page.evaluate(async () => {
      return (await window.api.settings.getSettings())?.clipboardClearDelay;
    }))).toBe(ClipboardClearDelay.THIRTY_SECONDS);
    await desktopApp.app.evaluate(({ clipboard }) => clipboard.writeText("Clipboard written after relaunch"));
    await expect.poll(() => readClipboardText(desktopApp!)).toBe("Clipboard written after relaunch");
    await desktopApp.page.waitForTimeout(testClipboardDelayMilliseconds * 2);

    await expect.poll(() => readClipboardText(desktopApp!)).toBe("Clipboard written after relaunch");
  });
});

async function launchClipboardTestApp(): Promise<TestElectronApp> {
  return launchTestElectronApp(undefined, { clipboardClearDelayMilliseconds: testClipboardDelayMilliseconds });
}

async function prepareCopiedNote(desktopApp: TestElectronApp): Promise<void> {
  await desktopApp.page.getByRole("button", { name: "Get Started" }).click();
  await desktopApp.page.evaluate(async ({ clearDelay, note }) => {
    const settings = await window.api.settings.getSettings();

    if (!settings) {
      throw new Error("Could not load application settings.");
    }

    await window.api.settings.setSettings({
      ...settings,
      clipboardClearDelay: clearDelay
    });
    window.api.storage.setNote(note);
  }, { clearDelay: ClipboardClearDelay.THIRTY_SECONDS, note: copiedNote });
  await expect.poll(async () => desktopApp.page.evaluate(async () => {
    return (await window.api.settings.getSettings())?.clipboardClearDelay;
  })).toBe(ClipboardClearDelay.THIRTY_SECONDS);
  await desktopApp.page.waitForTimeout(100);
  await expect(desktopApp.page.getByPlaceholder("Title")).toHaveValue(copiedNote.title);
}

async function enableClearCopiedTextOnLock(desktopApp: TestElectronApp): Promise<void> {
  await desktopApp.page.evaluate(async (clearDelay) => {
    const settings = await window.api.settings.getSettings();

    if (!settings) {
      throw new Error("Could not load application settings.");
    }

    await window.api.settings.setSettings({
      ...settings,
      clipboardClearDelay: clearDelay,
      clearCopiedTextOnLockEnabled: true,
      lockScreenEnabled: true
    });
    await window.api.security.setPassword("clipboard test password");
  }, ClipboardClearDelay.NEVER);

  await expect.poll(async () => desktopApp.page.evaluate(async () => {
    const settings = await window.api.settings.getSettings();
    return settings?.clearCopiedTextOnLockEnabled && settings.lockScreenEnabled;
  })).toBe(true);
}

async function selectNoteTitle(desktopApp: TestElectronApp): Promise<void> {
  await desktopApp.page.getByPlaceholder("Title").focus();
  await desktopApp.page.getByPlaceholder("Title").press(process.platform === "darwin" ? "Meta+A" : "Control+A");
}

async function copySelectedNote(desktopApp: TestElectronApp): Promise<void> {
  await expect(desktopApp.page.evaluate(() => document.execCommand("copy"))).resolves.toBe(true);
  await desktopApp.page.evaluate(() => window.api.clipboard.trackNoteCopy());
}

async function clearClipboard(desktopApp: TestElectronApp | undefined): Promise<void> {
  await desktopApp?.app.evaluate(({ clipboard }) => clipboard.clear()).catch(() => undefined);
}

async function readClipboardText(desktopApp: TestElectronApp): Promise<string> {
  return desktopApp.app.evaluate(({ clipboard }) => clipboard.readText());
}
