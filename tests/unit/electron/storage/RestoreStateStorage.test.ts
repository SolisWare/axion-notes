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
import { RestoreStateStorage } from "../../../../electron/storage/RestoreStateStorage";

const directories: string[] = [];

describe("RestoreStateStorage", () => {
  afterEach(async () => {
    await Promise.all(directories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
  });

  it("returns no history before the first restore", async () => {
    const { storage } = await createStorage();

    await expect(storage.getState()).resolves.toBeUndefined();
  });

  it("writes and reads the latest restore history", async () => {
    const { storage } = await createStorage();
    const state = {
      lastRestoredAt: "2026-11-07T12:00:00.000Z",
      version: 1 as const
    };

    await storage.setState(state);

    await expect(storage.getState()).resolves.toEqual(state);
  });

  it("rejects malformed persisted restore history instead of reporting it as a successful restore", async () => {
    const { backupDirectory, storage } = await createStorage();
    const stateFilePath = path.join(backupDirectory, "restore-state.json");

    await fs.promises.mkdir(path.dirname(stateFilePath), { recursive: true });
    await fs.promises.writeFile(stateFilePath, "{not valid JSON", "utf-8");

    await expect(storage.getState()).rejects.toThrow("Restore state is not valid JSON.");
  });

  it("does not write an unsupported restore history format", async () => {
    const { storage } = await createStorage();

    await expect(storage.setState({
      lastRestoredAt: "not-a-timestamp",
      version: 1
    })).rejects.toThrow("Restore state has an unsupported format.");
    await expect(storage.getState()).resolves.toBeUndefined();
  });
});

async function createStorage(): Promise<{ backupDirectory: string; storage: RestoreStateStorage }> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-restore-state-"));
  const backupDirectory = path.join(directory, "backup");
  directories.push(directory);
  return {
    backupDirectory,
    storage: new RestoreStateStorage(backupDirectory)
  };
}
