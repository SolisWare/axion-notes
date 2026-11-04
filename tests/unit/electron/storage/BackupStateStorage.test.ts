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
import { defaultBackupContentSelection } from "../../../../src/settings/defaultBackupContentSelection";
import { BackupState } from "../../../../src/types/BackupState";
import { BackupStateStorage, BACKUP_STATE_FILE_NAME } from "../../../../electron/storage/BackupStateStorage";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("BackupStateStorage", () => {
  it("defines app settings and window layout as the default optional backup content", () => {
    expect(defaultBackupContentSelection).toEqual({
      appSettings: true,
      mainWindowState: true
    });
  });

  it("creates the backup directory and persists the configured backup state", async () => {
    const { backupDirectory, storage } = await createStorage();
    const state = createBackupState();

    await storage.setState(state);

    expect(await fs.promises.readFile(path.join(backupDirectory, BACKUP_STATE_FILE_NAME), "utf-8")).toBe(JSON.stringify(state, null, 2));
    await expect(storage.getState()).resolves.toEqual(state);
  });

  it("returns undefined before backups have been initialized", async () => {
    const { storage } = await createStorage();

    await expect(storage.getState()).resolves.toBeUndefined();
  });

  it.each([
    ["malformed JSON", "{"],
    ["an unsupported version", JSON.stringify({ ...createBackupState(), version: 2 })],
    ["a missing content selection", JSON.stringify({ version: 1, initializedAt: "2026-11-04T12:00:00.000Z" })],
    ["an invalid backup timestamp", JSON.stringify({ ...createBackupState(), lastBackupCreatedAt: "not-a-date" })]
  ])("rejects %s", async (_name, content) => {
    const { backupDirectory, storage } = await createStorage();
    await fs.promises.mkdir(backupDirectory, { recursive: true });
    await fs.promises.writeFile(path.join(backupDirectory, BACKUP_STATE_FILE_NAME), content, "utf-8");

    await expect(storage.getState()).rejects.toThrow("Backup state");
  });
});

function createBackupState(): BackupState {
  return {
    version: 1,
    initializedAt: "2026-11-04T12:00:00.000Z",
    contentSelection: {
      appSettings: true,
      mainWindowState: true
    },
    lastBackupCreatedAt: "2026-11-04T12:30:00.000Z"
  };
}

async function createStorage(): Promise<{ backupDirectory: string; storage: BackupStateStorage }> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-backup-state-"));
  temporaryDirectories.push(directory);
  const backupDirectory = path.join(directory, "backup");

  return {
    backupDirectory,
    storage: new BackupStateStorage(backupDirectory)
  };
}
