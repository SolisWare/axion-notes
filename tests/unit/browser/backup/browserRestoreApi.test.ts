/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserRestoreApi } from "../../../../src/browser/backup/browserRestoreApi";
import { getBackupPreferences } from "../../../../src/backup/backupArchive";
import { ValidatedBackupArchive } from "../../../../src/backup/restoreArchive";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { AppThemePreference } from "../../../../src/settings/AppThemePreference";
import { RestoreApplyStatus } from "../../../../src/types/RestoreApplyResult";
import { RestoreChooseStatus } from "../../../../src/types/RestoreChooseResult";
import { RestoreInspectStatus } from "../../../../src/types/RestoreInspectResult";
import { RestoreNotesMode } from "../../../../src/types/RestoreNotesMode";
import { RestoreSettingsMode } from "../../../../src/types/RestoreSettingsMode";
import { BackupSource } from "../../../../src/types/BackupSource";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("browserRestoreApi", () => {
  it("inspects and applies a selected archive while restoring requested preferences", async () => {
    const archive = createArchive();
    const replaceNotes = vi.fn();
    const setSettings = vi.fn();
    const setRestoreState = vi.fn();
    const restoreApi = createBrowserRestoreApi({
      chooseArchive: async () => new Uint8Array([1]),
      getCurrentDate: () => new Date("2026-11-07T12:30:00.000Z"),
      getNotes: async () => [createNote("current", "Current")],
      getSettings: async () => defaultAppSettings,
      readArchive: () => archive,
      replaceNotes,
      setRestoreState,
      setSettings
    });

    await expect(restoreApi.chooseArchive()).resolves.toEqual({
      filePath: "browser-selected-backup",
      status: RestoreChooseStatus.SELECTED
    });
    await expect(restoreApi.inspect("browser-selected-backup")).resolves.toMatchObject({
      status: RestoreInspectStatus.READY,
      plan: { currentNotesCount: 1, incomingNotesCount: 1, requiresNotesModeSelection: true }
    });
    await expect(restoreApi.apply("browser-selected-backup", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.RESTORE_BACKUP
    })).resolves.toEqual({
      state: { lastRestoredAt: "2026-11-07T12:30:00.000Z", version: 1 },
      status: RestoreApplyStatus.APPLIED
    });

    expect(replaceNotes).toHaveBeenCalledWith(archive.notes);
    expect(setSettings).toHaveBeenCalledWith(expect.objectContaining({ theme: AppThemePreference.DARK }));
    expect(setRestoreState).toHaveBeenCalledWith({ lastRestoredAt: "2026-11-07T12:30:00.000Z", version: 1 });
  });

  it("reports an invalid archive after selection without changing local data", async () => {
    const replaceNotes = vi.fn();
    const restoreApi = createBrowserRestoreApi({
      chooseArchive: async () => new Uint8Array([1]),
      readArchive: () => {
        throw new Error("Invalid ZIP");
      },
      replaceNotes
    });

    await restoreApi.chooseArchive();

    await expect(restoreApi.inspect("browser-selected-backup")).resolves.toEqual({ status: RestoreInspectStatus.INVALID_ARCHIVE });
    await expect(restoreApi.apply("browser-selected-backup", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.KEEP_CURRENT
    })).resolves.toEqual({ status: RestoreApplyStatus.INVALID_ARCHIVE });
    expect(replaceNotes).not.toHaveBeenCalled();
  });

  it("restores the previous browser data when a later settings write fails", async () => {
    const archive = createArchive();
    const currentNotes = [createNote("current", "Current")];
    const replaceNotes = vi.fn();
    const setSettings = vi.fn()
      .mockImplementationOnce(() => {
        throw new Error("Storage quota exceeded");
      });
    const restoreApi = createBrowserRestoreApi({
      chooseArchive: async () => new Uint8Array([1]),
      getNotes: async () => currentNotes,
      getSettings: async () => defaultAppSettings,
      readArchive: () => archive,
      replaceNotes,
      setSettings
    });

    await restoreApi.chooseArchive();

    await expect(restoreApi.apply("browser-selected-backup", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.RESTORE_BACKUP
    })).resolves.toEqual({ status: RestoreApplyStatus.FAILED });

    expect(replaceNotes).toHaveBeenNthCalledWith(1, archive.notes);
    expect(replaceNotes).toHaveBeenNthCalledWith(2, currentNotes);
    expect(setSettings).toHaveBeenNthCalledWith(1, expect.objectContaining({ theme: AppThemePreference.DARK }));
    expect(setSettings).toHaveBeenNthCalledWith(2, defaultAppSettings);
  });

  it("does not persist desktop-only main-window layout data in browser Local Storage", async () => {
    const archive: ValidatedBackupArchive = {
      ...createArchive(),
      appSettings: undefined,
      contentSelection: { appSettings: false, mainWindowState: true },
      mainWindowState: {
        bounds: { height: 500, width: 700, x: 10, y: 20 },
        isMaximized: true
      }
    };
    const restoreApi = createBrowserRestoreApi({
      chooseArchive: async () => new Uint8Array([1]),
      getCurrentDate: () => new Date("2026-11-07T12:30:00.000Z"),
      readArchive: () => archive
    });

    await restoreApi.chooseArchive();

    await expect(restoreApi.apply("browser-selected-backup", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.KEEP_CURRENT
    })).resolves.toMatchObject({ status: RestoreApplyStatus.APPLIED });

    expect(Object.keys(localStorage).sort()).toEqual([
      "solisware.axion-notes.notes.backup",
      "solisware.axion-notes.notes.index",
      "solisware.axion-notes.restore-state"
    ]);
    expect(localStorage.getItem("solisware.axion-notes.notes.backup")).toContain("Backup");
  });

  it("keeps browser preferences when restoring notes from a desktop backup", async () => {
    const archive = { ...createArchive(), source: BackupSource.DESKTOP };
    const setSettings = vi.fn();
    const restoreApi = createBrowserRestoreApi({
      chooseArchive: async () => new Uint8Array([1]),
      getSettings: async () => defaultAppSettings,
      readArchive: () => archive,
      setSettings
    });

    await restoreApi.chooseArchive();
    await expect(restoreApi.apply("browser-selected-backup", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.RESTORE_BACKUP
    })).resolves.toMatchObject({ status: RestoreApplyStatus.APPLIED });

    expect(setSettings).not.toHaveBeenCalled();
  });
});

function createArchive(): ValidatedBackupArchive {
  return {
    appSettings: getBackupPreferences({ ...defaultAppSettings, theme: AppThemePreference.DARK }),
    contentSelection: { appSettings: true, mainWindowState: false },
    createdAt: "2026-11-07T12:00:00.000Z",
    noteOrder: ["backup"],
    notes: [createNote("backup", "Backup")],
    source: BackupSource.WEB
  };
}

function createNote(id: string, content: string) {
  return {
    bgcolor: "yellow" as const,
    content,
    createdOn: new Date("2026-11-07T10:00:00.000Z"),
    id,
    lastModifiedOn: new Date("2026-11-07T11:00:00.000Z")
  };
}
