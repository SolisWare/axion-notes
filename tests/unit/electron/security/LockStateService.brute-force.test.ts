/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BruteForceProtectionService } from "../../../../electron/security/BruteForceProtectionService";
import { LockMarkerService } from "../../../../electron/security/LockMarkerService";
import { LockStateService } from "../../../../electron/security/LockStateService";
import { PasswordService } from "../../../../electron/security/PasswordService";
import { NoteService } from "../../../../electron/storage/NoteService";
import { UnlockResultStatus } from "../../../../src/types/UnlockResultStatus";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";

vi.mock("electron", () => ({
  powerMonitor: {
    on: vi.fn(),
    getSystemIdleTime: vi.fn(() => 0)
  }
}));

const temporaryDirectories: string[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-30T12:00:00.000Z"));
});

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("LockStateService brute-force protection", () => {
  it("blocks the correct password during cooldown, then resets failed attempts after successful unlock", async () => {
    const passwordService = {
      verifyPassword: vi.fn(async (password: string) => password === "correct password")
    };
    const context = await createLockStateService({ passwordService });
    context.service.applySettings(defaultAppSettings);

    expect((await context.service.unlock("wrong password")).status).toBe(UnlockResultStatus.INVALID_PASSWORD);
    expect((await context.service.unlock("wrong password")).status).toBe(UnlockResultStatus.INVALID_PASSWORD);
    const cooldownResult = await context.service.unlock("wrong password");
    expect(cooldownResult.status).toBe(UnlockResultStatus.COOLDOWN_ACTIVE);

    expect((await context.service.unlock("correct password")).status).toBe(UnlockResultStatus.COOLDOWN_ACTIVE);
    expect(passwordService.verifyPassword).toHaveBeenCalledTimes(3);

    vi.advanceTimersByTime(60_001);
    expect((await context.service.unlock("correct password")).status).toBe(UnlockResultStatus.UNLOCKED);
    expect(context.service.getLockState().unlockCooldownUntil).toBeUndefined();

    expect((await context.service.unlock("wrong password")).status).toBe(UnlockResultStatus.INVALID_PASSWORD);
  });

  it("enforces the same cooldown before attempting encrypted note unlock", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const passwordService = {
      verifyPassword: vi.fn()
    };
    const unlockEncryption = vi.fn(async (password: string) => {
      if (password !== "correct password") {
        throw new Error("Incorrect password");
      }
    });
    const context = await createLockStateService({ passwordService, unlockEncryption });
    context.service.applySettings({
      ...defaultAppSettings,
      notesEncryptionEnabled: true
    });

    await context.service.unlock("wrong password");
    await context.service.unlock("wrong password");
    expect((await context.service.unlock("wrong password")).status).toBe(UnlockResultStatus.COOLDOWN_ACTIVE);
    expect((await context.service.unlock("correct password")).status).toBe(UnlockResultStatus.COOLDOWN_ACTIVE);
    expect(unlockEncryption).toHaveBeenCalledTimes(3);
    expect(passwordService.verifyPassword).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_001);
    expect((await context.service.unlock("correct password")).status).toBe(UnlockResultStatus.UNLOCKED);
    expect(unlockEncryption).toHaveBeenLastCalledWith("correct password");
  });

  it("does not apply cooldowns when brute-force protection is disabled", async () => {
    const passwordService = {
      verifyPassword: vi.fn(async () => false)
    };
    const context = await createLockStateService({ passwordService });
    context.service.applySettings({
      ...defaultAppSettings,
      bruteForceProtectionEnabled: false
    });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect((await context.service.unlock("wrong password")).status).toBe(UnlockResultStatus.INVALID_PASSWORD);
    }

    expect(passwordService.verifyPassword).toHaveBeenCalledTimes(4);
    expect(context.service.getLockState().unlockCooldownUntil).toBeUndefined();
  });
});

async function createLockStateService(options: {
  passwordService: { verifyPassword: ReturnType<typeof vi.fn> };
  unlockEncryption?: ReturnType<typeof vi.fn>;
}): Promise<{ service: LockStateService }> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-lock-state-brute-force-"));
  temporaryDirectories.push(directory);
  const bruteForceProtectionService = new BruteForceProtectionService(path.join(directory, "security", "brute-force.json"));
  const noteService = {
    applyEncryptionSetting: vi.fn(),
    getIsStorageMigrationInProgress: vi.fn(() => false),
    hasPlaintextCache: vi.fn(() => false),
    clearPlaintextCache: vi.fn(),
    hasEncryptionRecord: vi.fn(async () => true),
    unlockEncryption: options.unlockEncryption ?? vi.fn(async () => undefined)
  };

  return {
    service: new LockStateService(
      options.passwordService as unknown as PasswordService,
      bruteForceProtectionService,
      new LockMarkerService(path.join(directory, "security", "lock-marker.json")),
      noteService as unknown as NoteService
    )
  };
}
