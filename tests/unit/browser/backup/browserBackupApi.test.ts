/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it } from "vitest";
import { createBrowserBackupApi } from "../../../../src/browser/backup/browserBackupApi";
import { backupStateKey } from "../../../../src/browser/storage/backupStateStorage";
import { setNote } from "../../../../src/browser/storage/noteStorage";
import { setSettings } from "../../../../src/browser/storage/appSettingsStorage";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { BackupCreateStatus } from "../../../../src/types/BackupCreateResult";

afterEach(() => {
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

  it("fails archive creation before browser backups have been initialized", async () => {
    const backupApi = createBrowserBackupApi();

    await expect(backupApi.createArchive()).resolves.toEqual({ status: BackupCreateStatus.FAILED });
  });
});
