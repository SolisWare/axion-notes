/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindow } from "electron";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteService } from "../../../../electron/storage/NoteService";

const { app, BrowserWindow, dialog } = vi.hoisted(() => ({
  app: {
    on: vi.fn(),
    quit: vi.fn()
  },
  BrowserWindow: {
    getFocusedWindow: vi.fn()
  },
  dialog: {
    showMessageBoxSync: vi.fn()
  }
}));

vi.mock("electron", () => ({
  app,
  BrowserWindow,
  dialog
}));

vi.mock("../../../../electron/utils/electronI18n", () => ({
  translate: (key: string) => `[${key}]`
}));

let registerStorageMigrationGuard: typeof import("../../../../electron/storage/StorageMigrationGuard").registerStorageMigrationGuard;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  registerStorageMigrationGuard = (await import("../../../../electron/storage/StorageMigrationGuard")).registerStorageMigrationGuard;
});

describe("StorageMigrationGuard", () => {
  it("allows window closes immediately when storage is not migrating", () => {
    const noteService = createNoteService(false);
    registerStorageMigrationGuard(noteService);
    const window = createWindow();
    emitAppEvent("browser-window-created", {}, window.window);
    const closeEvent = createCloseEvent();

    window.emit("close", closeEvent);

    expect(closeEvent.preventDefault).not.toHaveBeenCalled();
    expect(dialog.showMessageBoxSync).not.toHaveBeenCalled();
  });

  it("keeps a migrating window open when the user chooses to keep waiting", () => {
    const noteService = createNoteService(true);
    dialog.showMessageBoxSync.mockReturnValue(0);
    registerStorageMigrationGuard(noteService);
    const window = createWindow();
    emitAppEvent("browser-window-created", {}, window.window);
    const closeEvent = createCloseEvent();

    window.emit("close", closeEvent);

    expect(closeEvent.preventDefault).toHaveBeenCalledOnce();
    expect(dialog.showMessageBoxSync).toHaveBeenCalledWith(window.window, expect.objectContaining({
      buttons: ["[keepWaiting]", "[closeAnyway]"],
      cancelId: 0,
      defaultId: 0,
      detail: "[storageMigrationCloseWarning]",
      message: "[storageMigrationRunning]",
      type: "warning"
    }));
    expect(window.close).not.toHaveBeenCalled();
  });

  it("allows exactly one confirmed close while migration continues", () => {
    const noteService = createNoteService(true);
    dialog.showMessageBoxSync.mockReturnValue(1);
    registerStorageMigrationGuard(noteService);
    const window = createWindow();
    emitAppEvent("browser-window-created", {}, window.window);

    window.emit("close", createCloseEvent());

    expect(window.close).toHaveBeenCalledOnce();
    expect(dialog.showMessageBoxSync).toHaveBeenCalledOnce();
    expect(window.closeEvents[0].preventDefault).not.toHaveBeenCalled();
  });

  it("requires confirmation before quitting during migration and permits the confirmed retry", () => {
    const noteService = createNoteService(true);
    const focusedWindow = createWindow();
    BrowserWindow.getFocusedWindow.mockReturnValue(focusedWindow.window);
    dialog.showMessageBoxSync.mockReturnValue(1);
    registerStorageMigrationGuard(noteService);
    const firstQuitEvent = createCloseEvent();

    emitAppEvent("before-quit", firstQuitEvent);

    expect(firstQuitEvent.preventDefault).toHaveBeenCalledOnce();
    expect(dialog.showMessageBoxSync).toHaveBeenCalledWith(focusedWindow.window, expect.objectContaining({
      buttons: ["[keepWaiting]", "[quitAnyway]"],
      detail: "[storageMigrationQuitWarning]",
      message: "[quitDuringStorageMigrationQuestion]"
    }));
    expect(app.quit).toHaveBeenCalledOnce();

    const confirmedQuitEvent = createCloseEvent();
    emitAppEvent("before-quit", confirmedQuitEvent);
    expect(confirmedQuitEvent.preventDefault).not.toHaveBeenCalled();
    expect(dialog.showMessageBoxSync).toHaveBeenCalledOnce();
  });

  it("shows the quit confirmation without a parent window when none is focused", () => {
    const noteService = createNoteService(true);
    BrowserWindow.getFocusedWindow.mockReturnValue(undefined);
    dialog.showMessageBoxSync.mockReturnValue(0);
    registerStorageMigrationGuard(noteService);
    const quitEvent = createCloseEvent();

    emitAppEvent("before-quit", quitEvent);

    expect(quitEvent.preventDefault).toHaveBeenCalledOnce();
    expect(dialog.showMessageBoxSync).toHaveBeenCalledWith(expect.objectContaining({
      buttons: ["[keepWaiting]", "[quitAnyway]"]
    }));
    expect(app.quit).not.toHaveBeenCalled();
  });
});

function createNoteService(isMigrating: boolean): NoteService {
  return {
    getIsStorageMigrationInProgress: vi.fn(() => isMigrating)
  } as unknown as NoteService;
}

function createWindow(): {
  close: ReturnType<typeof vi.fn>;
  closeEvents: ReturnType<typeof createCloseEvent>[];
  emit: (event: string, closeEvent: ReturnType<typeof createCloseEvent>) => void;
  window: BrowserWindow;
} {
  const listeners = new Map<string, (event: ReturnType<typeof createCloseEvent>) => void>();
  const closeEvents: ReturnType<typeof createCloseEvent>[] = [];
  const close = vi.fn(() => {
    const closeEvent = createCloseEvent();
    closeEvents.push(closeEvent);
    listeners.get("close")?.(closeEvent);
  });

  return {
    close,
    closeEvents,
    emit: (event, closeEvent) => listeners.get(event)?.(closeEvent),
    window: {
      close,
      on: vi.fn((event: string, listener: (closeEvent: ReturnType<typeof createCloseEvent>) => void) => listeners.set(event, listener))
    } as unknown as BrowserWindow
  };
}

function createCloseEvent() {
  return {
    preventDefault: vi.fn()
  };
}

function emitAppEvent(event: string, ...args: unknown[]): void {
  const listener = app.on.mock.calls.find(([registeredEvent]) => registeredEvent === event)?.[1] as ((...listenerArgs: unknown[]) => void) | undefined;

  if (!listener) {
    throw new Error(`Missing ${event} handler.`);
  }

  listener(...args);
}
