/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { BackupState } from "../../../../src/types/BackupState";
import { BackupService } from "../../../../electron/storage/BackupService";
import { BackupStateStorage } from "../../../../electron/storage/BackupStateStorage";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("BackupService", () => {
  it("initializes backup state with the default optional content selection", async () => {
    const { service, storage } = await createService("2026-11-04T12:00:00.000Z");

    await expect(service.initialize()).resolves.toEqual({
      version: 1,
      initializedAt: "2026-11-04T12:00:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      }
    });
    await expect(storage.getState()).resolves.toEqual({
      version: 1,
      initializedAt: "2026-11-04T12:00:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      }
    });
  });

  it("preserves existing backup selections and history when setup is repeated", async () => {
    const { service, storage } = await createService("2026-11-04T12:00:00.000Z");
    const existingState: BackupState = {
      version: 1,
      initializedAt: "2026-11-03T12:00:00.000Z",
      contentSelection: {
        appSettings: false,
        mainWindowState: true
      },
      lastBackupCreatedAt: "2026-11-03T12:30:00.000Z"
    };
    await storage.setState(existingState);

    await expect(service.initialize()).resolves.toEqual(existingState);
    await expect(storage.getState()).resolves.toEqual(existingState);
  });

  it("returns no state until backups have been initialized", async () => {
    const { service } = await createService("2026-11-04T12:00:00.000Z");

    await expect(service.getState()).resolves.toBeUndefined();
  });

  it("updates optional backup content while preserving setup and backup history", async () => {
    const { service, storage } = await createService("2026-11-04T12:00:00.000Z");
    const existingState: BackupState = {
      version: 1,
      initializedAt: "2026-11-03T12:00:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      },
      lastBackupCreatedAt: "2026-11-03T12:30:00.000Z"
    };
    await storage.setState(existingState);

    await expect(service.updateContentSelection({ appSettings: false, mainWindowState: true })).resolves.toEqual({
      ...existingState,
      contentSelection: {
        appSettings: false,
        mainWindowState: true
      }
    });
    await expect(storage.getState()).resolves.toEqual({
      ...existingState,
      contentSelection: {
        appSettings: false,
        mainWindowState: true
      }
    });
  });

  it("rejects updates before backups have been initialized", async () => {
    const { service } = await createService("2026-11-04T12:00:00.000Z");

    await expect(service.updateContentSelection({ appSettings: false, mainWindowState: false })).rejects.toThrow("Backups have not been initialized.");
  });
});

async function createService(timestamp: string): Promise<{ service: BackupService; storage: BackupStateStorage }> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-backup-service-"));
  temporaryDirectories.push(directory);
  const storage = new BackupStateStorage(path.join(directory, "backup"));

  return {
    service: new BackupService(storage, () => new Date(timestamp)),
    storage
  };
}
