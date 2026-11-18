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
import { LockMarkerService } from "../../../../electron/security/LockMarkerService";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("LockMarkerService", () => {
  it("creates the parent directory and writes the lock configuration marker", async () => {
    const { lockMarkerPath, service } = await createService();

    expect(await service.hasLockMarker()).toBe(false);

    await service.writeLockMarker();

    expect(await service.hasLockMarker()).toBe(true);
    await expect(fs.promises.readFile(lockMarkerPath, "utf-8")).resolves.toBe(JSON.stringify({
      version: 1,
      lockConfigured: true
    }, null, 2));
  });

  it("preserves an existing marker rather than replacing it", async () => {
    const { lockMarkerPath, service } = await createService();
    const existingMarker = "existing lock marker";
    await fs.promises.mkdir(path.dirname(lockMarkerPath), { recursive: true });
    await fs.promises.writeFile(lockMarkerPath, existingMarker, "utf-8");

    await service.writeLockMarker();

    await expect(fs.promises.readFile(lockMarkerPath, "utf-8")).resolves.toBe(existingMarker);
  });

  it("removes the marker and allows repeat removal", async () => {
    const { service } = await createService();
    await service.writeLockMarker();

    await service.removeLockMarker();
    await service.removeLockMarker();

    expect(await service.hasLockMarker()).toBe(false);
  });
});

async function createService(): Promise<{ lockMarkerPath: string; service: LockMarkerService }> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-lock-marker-"));
  temporaryDirectories.push(directory);
  const lockMarkerPath = path.join(directory, "security", ".lock");

  return {
    lockMarkerPath,
    service: new LockMarkerService(lockMarkerPath)
  };
}
