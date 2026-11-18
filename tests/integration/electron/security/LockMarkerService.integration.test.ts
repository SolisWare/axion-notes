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

describe("LockMarkerService startup integration", () => {
  it("keeps the app locked after settings are removed when a valid password and lock marker remain", async () => {
    const { lockMarkerService, lockStateService, passwordService } = await createServices();
    await passwordService.setPassword("correct password");
    await lockMarkerService.writeLockMarker();

    await lockStateService.initialize(defaultAppSettings);

    expect(lockStateService.getLockState()).toMatchObject({
      isLocked: true,
      isRecoveryRequired: false
    });
  });

  it("fails closed when a marker remains but the password record is unusable", async () => {
    const { directory, lockMarkerService, lockStateService } = await createServices();
    await lockMarkerService.writeLockMarker();
    const passwordPath = path.join(directory, "security", "password.json");
    await fs.promises.mkdir(path.dirname(passwordPath), { recursive: true });
    await fs.promises.writeFile(passwordPath, "not valid JSON", "utf-8");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await lockStateService.initialize(defaultAppSettings);

    expect(lockStateService.getLockState()).toMatchObject({
      isLocked: true,
      isRecoveryRequired: true
    });
  });
});

async function createServices(): Promise<{
  directory: string;
  lockMarkerService: LockMarkerService;
  lockStateService: LockStateService;
  passwordService: PasswordService;
}> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-lock-marker-integration-"));
  temporaryDirectories.push(directory);
  const passwordService = new PasswordService(path.join(directory, "security", "password.json"));
  const lockMarkerService = new LockMarkerService(path.join(directory, ".lock"));
  const noteService = {
    applyEncryptionSetting: vi.fn(),
    hasEncryptionRecord: vi.fn(async () => false)
  } as unknown as NoteService;

  return {
    directory,
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
