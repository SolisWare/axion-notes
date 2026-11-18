/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BruteForceProtectionService } from "../../../../electron/security/BruteForceProtectionService";
import { LockMarkerService } from "../../../../electron/security/LockMarkerService";
import { LockStateService } from "../../../../electron/security/LockStateService";
import { PasswordService } from "../../../../electron/security/PasswordService";
import { NoteService } from "../../../../electron/storage/NoteService";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { UnlockResultStatus } from "../../../../src/types/UnlockResultStatus";

vi.mock("electron", () => ({
  powerMonitor: {
    getSystemIdleTime: vi.fn(() => 0),
    on: vi.fn()
  }
}));

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("LockStateService persisted security integration", () => {
  it("locks, unlocks, and locks again using persisted password and marker records", async () => {
    const { lockMarkerService, lockStateService, passwordService } = await createServices();
    await passwordService.setPassword("correct password");
    await lockMarkerService.writeLockMarker();

    await lockStateService.initialize({
      ...defaultAppSettings,
      lockScreenEnabled: true
    });
    expect(lockStateService.getIsLocked()).toBe(true);

    await expect(lockStateService.unlock("incorrect password")).resolves.toEqual({
      status: UnlockResultStatus.INVALID_PASSWORD
    });
    await expect(lockStateService.unlock("correct password")).resolves.toEqual({
      status: UnlockResultStatus.UNLOCKED
    });
    expect(lockStateService.getIsLocked()).toBe(false);

    await expect(lockStateService.lock()).resolves.toBe(true);
    expect(lockStateService.getIsLocked()).toBe(true);
    expect(await lockMarkerService.hasLockMarker()).toBe(true);
  });

  it("clears the lock state and persisted marker after verified lock removal", async () => {
    const { lockMarkerService, lockStateService, passwordService } = await createServices();
    await passwordService.setPassword("correct password");
    await lockMarkerService.writeLockMarker();
    await lockStateService.initialize({
      ...defaultAppSettings,
      lockScreenEnabled: true
    });

    await lockStateService.clearLockConfigured();

    expect(lockStateService.getLockState()).toMatchObject({
      isLocked: false,
      isRecoveryRequired: false
    });
    expect(await lockMarkerService.hasLockMarker()).toBe(false);
  });
});

async function createServices(): Promise<{
  lockMarkerService: LockMarkerService;
  lockStateService: LockStateService;
  passwordService: PasswordService;
}> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-lock-state-integration-"));
  temporaryDirectories.push(directory);
  const passwordService = new PasswordService(path.join(directory, "security", "password.json"));
  const lockMarkerService = new LockMarkerService(path.join(directory, ".lock"));
  const noteService = {
    applyEncryptionSetting: vi.fn(),
    getIsStorageMigrationInProgress: vi.fn(() => false),
    hasEncryptionRecord: vi.fn(async () => false)
  } as unknown as NoteService;

  return {
    lockMarkerService,
    lockStateService: new LockStateService(
      passwordService,
      new BruteForceProtectionService(path.join(directory, "security", "brute-force-protection.json")),
      lockMarkerService,
      noteService
    ),
    passwordService
  };
}
