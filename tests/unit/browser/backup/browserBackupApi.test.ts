/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserBackupApi } from "../../../../src/browser/backup/browserBackupApi";
import { backupStateKey } from "../../../../src/browser/storage/backupStateStorage";
import { setNote } from "../../../../src/browser/storage/noteStorage";
import { setSettings } from "../../../../src/browser/storage/appSettingsStorage";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { BackupCreateStatus } from "../../../../src/types/BackupCreateResult";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("browserBackupApi", () => {
  it("initializes browser backups without the desktop-only window state", async () => {
    const backupApi = createBrowserBackupApi({
      getCurrentDate: () => new Date("2026-11-06T10:30:00.000Z")
    });

    await expect(backupApi.initialize()).resolves.toEqual({
      version: 1,
      initializedAt: "2026-11-06T10:30:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: false
      }
    });
    expect(JSON.parse(localStorage.getItem(backupStateKey) ?? "")).toMatchObject({
      contentSelection: {
        mainWindowState: false
      }
    });
  });

  it("preserves configuration when initialized again", async () => {
    localStorage.setItem(backupStateKey, JSON.stringify({
      version: 1,
      initializedAt: "2026-11-06T10:00:00.000Z",
      contentSelection: {
        appSettings: false,
        mainWindowState: false
      }
    }));
    const backupApi = createBrowserBackupApi({
      getCurrentDate: () => new Date("2026-11-06T10:30:00.000Z")
    });

    await expect(backupApi.initialize()).resolves.toMatchObject({
      initializedAt: "2026-11-06T10:00:00.000Z",
      contentSelection: {
        appSettings: false,
        mainWindowState: false
      }
    });
  });

  it("updates browser options without allowing desktop window state", async () => {
    const backupApi = createBrowserBackupApi({
      getCurrentDate: () => new Date("2026-11-06T10:30:00.000Z")
    });
    await backupApi.initialize();

    await expect(backupApi.updateContentSelection({
      appSettings: false,
      mainWindowState: true
    })).resolves.toMatchObject({
      contentSelection: {
        appSettings: false,
        mainWindowState: false
      }
    });
  });

  it("normalizes desktop-only configuration when it is read from browser storage", async () => {
    localStorage.setItem(backupStateKey, JSON.stringify({
      version: 1,
      initializedAt: "2026-11-06T10:00:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      }
    }));
    const backupApi = createBrowserBackupApi();

    await expect(backupApi.getState()).resolves.toMatchObject({
      contentSelection: {
        appSettings: true,
        mainWindowState: false
      }
    });
  });

  it("returns no state and cannot update options before browser backups are initialized", async () => {
    const backupApi = createBrowserBackupApi();

    await expect(backupApi.getState()).resolves.toBeUndefined();
    await expect(backupApi.updateContentSelection({ appSettings: false, mainWindowState: false })).resolves.toBeUndefined();
    await expect(backupApi.deleteArchive()).resolves.toEqual({ status: "failed" });
    await expect(backupApi.saveCopy()).resolves.toEqual({ status: "failed" });
  });

  it("creates a download archive and records when the browser backup was created", async () => {
    const archive = new Uint8Array([1, 2, 3]);
    const downloads: Array<{ archive: Uint8Array; fileName: string }> = [];
    const backupApi = createBrowserBackupApi({
      createArchive: async () => archive,
      downloadArchive: (downloadedArchive, fileName) => downloads.push({ archive: downloadedArchive, fileName }),
      getCurrentDate: () => new Date("2026-11-06T15:04:05.000Z")
    });
    setSettings(defaultAppSettings);
    setNote({
      id: "note-1",
      bgcolor: "yellow",
      content: "Browser note",
      createdOn: new Date("2026-11-06T10:00:00.000Z"),
      lastModifiedOn: new Date("2026-11-06T10:15:00.000Z")
    });
    await backupApi.initialize();

    await expect(backupApi.createArchive()).resolves.toMatchObject({
      status: BackupCreateStatus.CREATED,
      state: {
        lastBackupCreatedAt: "2026-11-06T15:04:05.000Z"
      }
    });
    expect(downloads).toEqual([{
      archive,
      fileName: "axion-notes-backup-11-6-2026_3-04-05-PM.zip"
    }]);
  });

  it("omits settings from browser backup archives when they are not selected", async () => {
    const createArchive = vi.fn(async () => new Uint8Array([1]));
    const downloadArchive = vi.fn();
    const backupApi = createBrowserBackupApi({
      createArchive,
      downloadArchive,
      getCurrentDate: () => new Date("2026-11-06T15:04:05.000Z")
    });
    await backupApi.initialize({ appSettings: false, mainWindowState: true });

    await expect(backupApi.createArchive()).resolves.toMatchObject({ status: BackupCreateStatus.CREATED });
    expect(createArchive).toHaveBeenCalledWith(expect.objectContaining({
      appSettings: undefined,
      contentSelection: { appSettings: false, mainWindowState: false },
      notes: [],
      source: "web"
    }));
    expect(downloadArchive).toHaveBeenCalledWith(expect.any(Uint8Array), expect.stringMatching(/^axion-notes-backup-.*\.zip$/));
  });

  it("fails archive creation before browser backups have been initialized", async () => {
    const backupApi = createBrowserBackupApi();

    await expect(backupApi.createArchive()).resolves.toEqual({ status: BackupCreateStatus.FAILED });
  });

  it("fails safely and leaves its state unchanged when archive creation fails", async () => {
    const error = new Error("Archive failed");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const backupApi = createBrowserBackupApi({
      createArchive: async () => {
        throw error;
      }
    });
    await backupApi.initialize();

    await expect(backupApi.createArchive()).resolves.toEqual({ status: BackupCreateStatus.FAILED });
    expect(warning).toHaveBeenCalledWith("Failed to create browser backup:", error);
    await expect(backupApi.getState()).resolves.not.toHaveProperty("lastBackupCreatedAt");
  });

  it("fails safely when browser backup initialization or option persistence fails", async () => {
    const error = new Error("Storage unavailable");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw error;
    });
    const backupApi = createBrowserBackupApi();

    await expect(backupApi.initialize()).resolves.toBeUndefined();
    expect(warning).toHaveBeenCalledWith("Failed to initialize browser backups:", error);

    setItem.mockRestore();
    await backupApi.initialize();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw error;
    });

    await expect(backupApi.updateContentSelection({ appSettings: false, mainWindowState: false })).resolves.toBeUndefined();
    expect(warning).toHaveBeenCalledWith("Failed to update browser backup options:", error);
  });
});
