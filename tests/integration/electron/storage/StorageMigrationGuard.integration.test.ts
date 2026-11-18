/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindow } from "electron";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncryptionKeyService } from "../../../../electron/security/EncryptionKeyService";
import { EncryptionService } from "../../../../electron/security/EncryptionService";
import { NoteService } from "../../../../electron/storage/NoteService";
import { NoteColorKey } from "../../../../src/theme/NoteColors";

const { app, BrowserWindow, dialog } = vi.hoisted(() => ({
  app: { on: vi.fn() },
  BrowserWindow: { getFocusedWindow: vi.fn() },
  dialog: { showMessageBoxSync: vi.fn() }
}));

vi.mock("electron", () => ({
  app,
  BrowserWindow,
  dialog
}));

vi.mock("../../../../electron/utils/electronI18n", () => ({
  translate: (key: string) => key
}));

const temporaryDirectories: string[] = [];
let registerStorageMigrationGuard: typeof import("../../../../electron/storage/StorageMigrationGuard").registerStorageMigrationGuard;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  dialog.showMessageBoxSync.mockReturnValue(0);
  registerStorageMigrationGuard = (await import("../../../../electron/storage/StorageMigrationGuard")).registerStorageMigrationGuard;
});

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("StorageMigrationGuard integration", () => {
  it("blocks a close while a real encryption migration is paused", async () => {
    const context = await createMigratingNoteService();
    registerStorageMigrationGuard(context.noteService);
    const window = createWindow();
    emitAppEvent("browser-window-created", {}, window.window);

    const migration = context.noteService.enableEncryption("correct password");
    await context.waitForPausedRename;
    expect(context.noteService.getIsStorageMigrationInProgress()).toBe(true);

    window.emit("close", window.closeEvent);

    expect(window.closeEvent.preventDefault).toHaveBeenCalledOnce();
    expect(dialog.showMessageBoxSync).toHaveBeenCalledOnce();

    context.releaseRename();
    await migration;
    expect(context.noteService.getIsStorageMigrationInProgress()).toBe(false);
  });
});

async function createMigratingNoteService(): Promise<{
  noteService: NoteService;
  releaseRename: () => void;
  waitForPausedRename: Promise<void>;
}> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-storage-migration-guard-"));
  temporaryDirectories.push(directory);
  const appDataDir = path.join(directory, "data");
  const encryptionRecordPath = path.join(directory, "security", "encryption.json");
  await fs.promises.mkdir(appDataDir, { recursive: true });
  const date = new Date("2026-11-18T12:00:00.000Z");
  await fs.promises.writeFile(path.join(appDataDir, "note-1.json"), JSON.stringify({
    id: "note-1",
    bgcolor: NoteColorKey.YELLOW,
    title: "Migration note",
    content: "Keep this note safe.",
    createdOn: date,
    lastModifiedOn: date
  }), "utf-8");
  await fs.promises.writeFile(path.join(appDataDir, "note-order.json"), JSON.stringify(["note-1"]), "utf-8");

  let releaseRename: (() => void) | undefined;
  let signalPausedRename: (() => void) | undefined;
  const waitForPausedRename = new Promise<void>((resolve) => {
    signalPausedRename = resolve;
  });
  const encryptionService = new EncryptionService();
  const noteService = new NoteService(
    appDataDir,
    encryptionRecordPath,
    encryptionService,
    new EncryptionKeyService(encryptionService),
    async (oldPath, newPath) => {
      if (oldPath.endsWith(".notes-encryption-staging/notes.manifest")) {
        signalPausedRename?.();
        await new Promise<void>((resolve) => {
          releaseRename = resolve;
        });
      }

      await fs.promises.rename(oldPath, newPath);
    }
  );

  return {
    noteService,
    releaseRename: () => releaseRename?.(),
    waitForPausedRename
  };
}

function createWindow(): {
  closeEvent: { preventDefault: ReturnType<typeof vi.fn> };
  emit: (event: string, closeEvent: { preventDefault: ReturnType<typeof vi.fn> }) => void;
  window: BrowserWindow;
} {
  const listeners = new Map<string, (event: { preventDefault: ReturnType<typeof vi.fn> }) => void>();
  const closeEvent = { preventDefault: vi.fn() };

  return {
    closeEvent,
    emit: (event, eventData) => listeners.get(event)?.(eventData),
    window: {
      on: vi.fn((event: string, listener: (eventData: { preventDefault: ReturnType<typeof vi.fn> }) => void) => listeners.set(event, listener))
    } as unknown as BrowserWindow
  };
}

function emitAppEvent(event: string, ...args: unknown[]): void {
  const listener = app.on.mock.calls.find(([registeredEvent]) => registeredEvent === event)?.[1] as ((...listenerArgs: unknown[]) => void) | undefined;

  if (!listener) {
    throw new Error(`Missing ${event} handler.`);
  }

  listener(...args);
}
