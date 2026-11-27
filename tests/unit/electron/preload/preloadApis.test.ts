/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { appWindowApi } from "../../../../electron/preload/appWindowApi";
import { backupApi } from "../../../../electron/preload/backupApi";
import { clipboardApi } from "../../../../electron/preload/clipboardApi";
import { menuApi } from "../../../../electron/preload/menuApi";
import { noteSortApi } from "../../../../electron/preload/noteSortApi";
import { noteWindowApi } from "../../../../electron/preload/noteWindowApi";
import { restoreApi } from "../../../../electron/preload/restoreApi";
import { securityApi } from "../../../../electron/preload/securityApi";
import { settingsApi } from "../../../../electron/preload/settingsApi";
import { storageApi } from "../../../../electron/preload/storageApi";
import { systemThemeApi } from "../../../../electron/preload/systemThemeApi";
import { off, on, receive, send } from "../../../../electron/preload/ipcHelpers";
import { NoteLayoutPreference } from "../../../../src/settings/NoteLayoutPreference";
import { NoteSortOrder } from "../../../../src/settings/noteSortOrder";

vi.mock("../../../../electron/preload/ipcHelpers", () => ({
  off: vi.fn(),
  on: vi.fn(),
  receive: vi.fn(),
  send: vi.fn()
}));

describe("preload APIs", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends app-window, clipboard, note-window, and sort commands through their channels", () => {
    const restartOptions = { relaunch: true };

    appWindowApi.close();
    appWindowApi.readyToShow();
    appWindowApi.restart(restartOptions);
    appWindowApi.setAlwaysOnTop(true);
    appWindowApi.setLayout(NoteLayoutPreference.LIST);
    clipboardApi.trackNoteCopy();
    noteWindowApi.open("note-1", { openInNewWindow: true });
    noteSortApi.requestSort();

    expect(send).toHaveBeenNthCalledWith(1, channels.appWindow.close);
    expect(send).toHaveBeenNthCalledWith(2, channels.appWindow.readyToShow);
    expect(send).toHaveBeenNthCalledWith(3, channels.appWindow.restart, restartOptions);
    expect(send).toHaveBeenNthCalledWith(4, channels.appWindow.setAlwaysOnTop, true);
    expect(send).toHaveBeenNthCalledWith(5, channels.appWindow.setLayout, NoteLayoutPreference.LIST);
    expect(send).toHaveBeenNthCalledWith(6, channels.clipboard.trackNoteCopy);
    expect(send).toHaveBeenNthCalledWith(7, channels.noteWindow.open, "note-1", { openInNewWindow: true });
    expect(send).toHaveBeenNthCalledWith(8, channels.noteSort.requestSort);
  });

  it("invokes backup and restore operations with their arguments", async () => {
    const selection = { appSettings: true, mainWindowState: false };
    const restoreOptions = { notesMode: "addToCurrent", settingsMode: "keepCurrent" };

    await backupApi.createArchive("password");
    await backupApi.deleteArchive();
    await backupApi.getState();
    await backupApi.initialize(selection);
    await backupApi.saveCopy();
    await backupApi.updateContentSelection(selection);
    await restoreApi.apply("/tmp/archive.zip", restoreOptions);
    await restoreApi.chooseArchive();
    await restoreApi.getState();
    await restoreApi.inspect("/tmp/archive.zip", "password");

    expect(receive).toHaveBeenNthCalledWith(1, channels.backup.createArchive, "password");
    expect(receive).toHaveBeenNthCalledWith(2, channels.backup.deleteArchive);
    expect(receive).toHaveBeenNthCalledWith(3, channels.backup.getState);
    expect(receive).toHaveBeenNthCalledWith(4, channels.backup.initialize, selection);
    expect(receive).toHaveBeenNthCalledWith(5, channels.backup.saveCopy);
    expect(receive).toHaveBeenNthCalledWith(6, channels.backup.updateContentSelection, selection);
    expect(receive).toHaveBeenNthCalledWith(7, channels.restore.apply, "/tmp/archive.zip", restoreOptions);
    expect(receive).toHaveBeenNthCalledWith(8, channels.restore.chooseArchive);
    expect(receive).toHaveBeenNthCalledWith(9, channels.restore.getState);
    expect(receive).toHaveBeenNthCalledWith(10, channels.restore.inspect, "/tmp/archive.zip", "password");
  });

  it("sends each native-menu state update", () => {
    menuApi.setDeleteAllNotesEnabled(true);
    menuApi.setEditSelectionState({ canCopy: true } as never);
    menuApi.setNoteSelectionState({ selectedCount: 1 } as never);
    menuApi.setRichTextFormatState({ bold: true } as never);
    menuApi.setNewNoteEnabled(false);

    expect(send).toHaveBeenNthCalledWith(1, channels.menu.setDeleteAllNotesEnabled, true);
    expect(send).toHaveBeenNthCalledWith(2, channels.menu.setEditSelectionState, { canCopy: true });
    expect(send).toHaveBeenNthCalledWith(3, channels.menu.setNoteSelectionState, { selectedCount: 1 });
    expect(send).toHaveBeenNthCalledWith(4, channels.menu.setRichTextFormatState, { bold: true });
    expect(send).toHaveBeenNthCalledWith(5, channels.menu.setNewNoteEnabled, false);
  });

  it("invokes all security operations with their passwords", async () => {
    await securityApi.hasPassword();
    await securityApi.getLockState();
    await securityApi.getSecurityFolderLocation();
    await securityApi.lock();
    await securityApi.unlock("password");
    await securityApi.setPassword("password");
    await securityApi.verifyPassword("password");
    await securityApi.changePassword("old", "new");
    await securityApi.clearPassword();
    await securityApi.enableEncryption("password");
    await securityApi.disableEncryption("password");

    expect(receive).toHaveBeenNthCalledWith(1, channels.security.hasPassword);
    expect(receive).toHaveBeenNthCalledWith(2, channels.security.getLockState);
    expect(receive).toHaveBeenNthCalledWith(3, channels.security.getSecurityFolderLocation);
    expect(receive).toHaveBeenNthCalledWith(4, channels.security.lock);
    expect(receive).toHaveBeenNthCalledWith(5, channels.security.unlock, "password");
    expect(receive).toHaveBeenNthCalledWith(6, channels.security.setPassword, "password");
    expect(receive).toHaveBeenNthCalledWith(7, channels.security.verifyPassword, "password");
    expect(receive).toHaveBeenNthCalledWith(8, channels.security.changePassword, "old", "new");
    expect(receive).toHaveBeenNthCalledWith(9, channels.security.clearPassword);
    expect(receive).toHaveBeenNthCalledWith(10, channels.security.enableEncryption, "password");
    expect(receive).toHaveBeenNthCalledWith(11, channels.security.disableEncryption, "password");
  });

  it("sends storage and settings changes and invokes their reads", async () => {
    const settings = { clipboardClearDelay: 30 };
    const note = { id: "note-1" };

    storageApi.setNote(note as never);
    storageApi.setNoteOrder(["note-1"]);
    storageApi.deleteNote("note-1");
    storageApi.deleteAllNotes();
    settingsApi.setSettings(settings as never);
    await storageApi.getNotes();
    await storageApi.getNotesWithAccessState();
    await storageApi.getNotesFolderLocation();
    await storageApi.getBackupFolderLocation();
    await settingsApi.getSettings();
    await settingsApi.getSettingsFolderLocation();

    expect(send).toHaveBeenNthCalledWith(1, channels.storage.setNote, note);
    expect(send).toHaveBeenNthCalledWith(2, channels.storage.setNoteOrder, ["note-1"]);
    expect(send).toHaveBeenNthCalledWith(3, channels.storage.deleteNote, "note-1");
    expect(send).toHaveBeenNthCalledWith(4, channels.storage.deleteAllNotes);
    expect(send).toHaveBeenNthCalledWith(5, channels.settings.setSettings, settings);
    expect(receive).toHaveBeenNthCalledWith(1, channels.storage.getNotes);
    expect(receive).toHaveBeenNthCalledWith(2, channels.storage.getNotesWithAccessState);
    expect(receive).toHaveBeenNthCalledWith(3, channels.storage.getNotesFolderLocation);
    expect(receive).toHaveBeenNthCalledWith(4, channels.storage.getBackupFolderLocation);
    expect(receive).toHaveBeenNthCalledWith(5, channels.settings.getSettings);
    expect(receive).toHaveBeenNthCalledWith(6, channels.settings.getSettingsFolderLocation);
  });

  it("returns safe read fallbacks when storage or settings IPC fails", async () => {
    vi.mocked(receive).mockRejectedValue(new Error("unavailable"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(storageApi.getNotes()).resolves.toEqual([]);
    await expect(storageApi.getNotesWithAccessState()).resolves.toEqual({ status: "available", notes: [] });
    await expect(storageApi.getNotesFolderLocation()).resolves.toBe("");
    await expect(storageApi.getBackupFolderLocation()).resolves.toBe("");
    await expect(settingsApi.getSettings()).resolves.toBeUndefined();
    await expect(settingsApi.getSettingsFolderLocation()).resolves.toBe("");
    expect(error).toHaveBeenCalledTimes(6);
  });

  it("subscribes, forwards payloads, and unsubscribes from native events", async () => {
    const callbacks = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    const unsubscribers = [
      menuApi.onMenuNewNote(callbacks[0]),
      menuApi.onMenuSetNoteLayout(callbacks[1]),
      menuApi.onMenuSetNoteSortOrder(callbacks[2]),
      menuApi.onMenuResortNotes(callbacks[3]),
      menuApi.onMenuShowWelcome(callbacks[4]),
      menuApi.onMenuSelectNote(callbacks[5]),
      menuApi.onMenuSelectAllNotes(callbacks[6]),
      menuApi.onMenuCancelNoteSelection(callbacks[7]),
      menuApi.onMenuDeleteAllNotes(callbacks[8]),
      menuApi.onMenuRichTextFormat(callbacks[9]),
      noteSortApi.onSortRequest(callbacks[10]),
      noteSortApi.onSortApplied(callbacks[11]),
      noteWindowApi.onClosed(callbacks[12])
    ];

    const listeners = vi.mocked(on).mock.calls.map(([, listener]) => listener);
    listeners[0]({} as Electron.IpcRendererEvent);
    listeners[1]({} as Electron.IpcRendererEvent, NoteLayoutPreference.LIST);
    listeners[2]({} as Electron.IpcRendererEvent, NoteSortOrder.TITLE_ASC);
    listeners[3]({} as Electron.IpcRendererEvent);
    listeners[4]({} as Electron.IpcRendererEvent);
    listeners[5]({} as Electron.IpcRendererEvent);
    listeners[6]({} as Electron.IpcRendererEvent);
    listeners[7]({} as Electron.IpcRendererEvent);
    listeners[8]({} as Electron.IpcRendererEvent);
    listeners[9]({} as Electron.IpcRendererEvent, "bold" as never);
    listeners[10]({} as Electron.IpcRendererEvent);
    listeners[11]({} as Electron.IpcRendererEvent);
    listeners[12]({} as Electron.IpcRendererEvent, "note-1");

    expect(callbacks[0]).toHaveBeenCalledOnce();
    expect(callbacks[1]).toHaveBeenCalledWith(NoteLayoutPreference.LIST);
    expect(callbacks[2]).toHaveBeenCalledWith(NoteSortOrder.TITLE_ASC);
    expect(callbacks[3]).toHaveBeenCalledOnce();
    expect(callbacks[4]).toHaveBeenCalledOnce();
    expect(callbacks[5]).toHaveBeenCalledOnce();
    expect(callbacks[6]).toHaveBeenCalledOnce();
    expect(callbacks[7]).toHaveBeenCalledOnce();
    expect(callbacks[8]).toHaveBeenCalledOnce();
    expect(callbacks[9]).toHaveBeenCalledWith("bold");
    expect(callbacks[10]).toHaveBeenCalledOnce();
    expect(callbacks[11]).toHaveBeenCalledOnce();
    expect(callbacks[12]).toHaveBeenCalledWith("note-1");

    unsubscribers.forEach((unsubscribe) => unsubscribe());
    expect(off).toHaveBeenCalledTimes(unsubscribers.length);
  });

  it("subscribes to security, restore, settings, storage, and system-theme changes", async () => {
    vi.mocked(receive).mockResolvedValueOnce("light" as never);
    const lockStateCallback = vi.fn();
    const secureLockCallback = vi.fn();
    const encryptionCallback = vi.fn();
    const restoreCallback = vi.fn();
    const settingsCallback = vi.fn();
    const notesCallback = vi.fn();
    const themeCallback = vi.fn();
    const unsubscribers = [
      securityApi.onLockStateChange(lockStateCallback),
      securityApi.onSecureLockComplete(secureLockCallback),
      securityApi.onEncryptionProgress(encryptionCallback),
      restoreApi.onProgress(restoreCallback),
      settingsApi.onSettingsChange(settingsCallback),
      storageApi.onNotesChange(notesCallback),
      systemThemeApi.onThemeChange(themeCallback)
    ];
    await Promise.resolve();

    const listeners = vi.mocked(on).mock.calls.map(([, listener]) => listener);
    listeners[0]({} as Electron.IpcRendererEvent, { isLocked: true } as never);
    listeners[1]({} as Electron.IpcRendererEvent);
    listeners[2]({} as Electron.IpcRendererEvent, { processed: 1 } as never);
    listeners[3]({} as Electron.IpcRendererEvent, { completed: 1 } as never);
    listeners[4]({} as Electron.IpcRendererEvent, { clipboardClearDelay: 30 } as never);
    listeners[5]({} as Electron.IpcRendererEvent, { type: "updated" } as never);
    listeners[6]({} as Electron.IpcRendererEvent, "dark" as never);

    expect(lockStateCallback).toHaveBeenCalledWith({ isLocked: true });
    expect(secureLockCallback).toHaveBeenCalledOnce();
    expect(encryptionCallback).toHaveBeenCalledWith({ processed: 1 });
    expect(restoreCallback).toHaveBeenCalledWith({ completed: 1 });
    expect(settingsCallback).toHaveBeenCalledWith({ clipboardClearDelay: 30 });
    expect(notesCallback).toHaveBeenCalledWith({ type: "updated" });
    expect(themeCallback).toHaveBeenCalledWith("light");
    expect(themeCallback).toHaveBeenCalledWith("dark");

    unsubscribers.forEach((unsubscribe) => unsubscribe());
    expect(off).toHaveBeenCalledTimes(unsubscribers.length);
  });

  it("reports a failed initial system-theme lookup without interrupting the subscription", async () => {
    vi.mocked(receive).mockRejectedValueOnce(new Error("unavailable"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const unsubscribe = systemThemeApi.onThemeChange(vi.fn());
    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith("Failed to load system theme:", "unavailable");
    });
    unsubscribe();
  });
});
