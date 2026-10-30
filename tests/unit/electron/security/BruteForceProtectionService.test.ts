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

const temporaryDirectories: string[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-30T10:00:00.000Z"));
});

afterEach(async () => {
  vi.useRealTimers();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("BruteForceProtectionService", () => {
  it("applies each escalating cooldown and retains the final stage", async () => {
    const { service } = await createService();
    const stages = [
      { attempts: 3, cooldownMs: 60_000 },
      { attempts: 2, cooldownMs: 5 * 60_000 },
      { attempts: 1, cooldownMs: 10 * 60_000 },
      { attempts: 3, cooldownMs: 30 * 60_000 },
      { attempts: 2, cooldownMs: 60 * 60_000 },
      { attempts: 1, cooldownMs: 24 * 60 * 60_000 },
      { attempts: 1, cooldownMs: 24 * 60 * 60_000 }
    ];

    for (const stage of stages) {
      for (let attempt = 1; attempt <= stage.attempts; attempt += 1) {
        const status = await service.recordFailedAttempt();

        expect(status.isCooldownActive).toBe(attempt === stage.attempts);
      }

      const activeStatus = service.getStatus();
      expect(activeStatus.cooldownUntil).toBe(new Date(Date.now() + stage.cooldownMs).toISOString());
      vi.advanceTimersByTime(stage.cooldownMs + 1);
      expect(service.getStatus().isCooldownActive).toBe(false);
    }
  });

  it("does not advance failed attempts while a cooldown is active", async () => {
    const { service } = await createService();

    await service.recordFailedAttempt();
    await service.recordFailedAttempt();
    const initialCooldown = await service.recordFailedAttempt();
    const blockedAttempt = await service.recordFailedAttempt();

    expect(blockedAttempt).toEqual(initialCooldown);
    vi.advanceTimersByTime(60_001);
    await service.recordFailedAttempt();
    expect((await service.recordFailedAttempt()).isCooldownActive).toBe(true);
  });

  it("persists active cooldown state across service restart and resets it on success", async () => {
    const { recordPath, service } = await createService();
    await service.recordFailedAttempt();
    await service.recordFailedAttempt();
    await service.recordFailedAttempt();

    const restartedService = new BruteForceProtectionService(recordPath);
    await restartedService.initialize();
    expect(restartedService.getStatus().isCooldownActive).toBe(true);

    await restartedService.reset();
    const resetService = new BruteForceProtectionService(recordPath);
    await resetService.initialize();
    expect(resetService.getStatus()).toEqual({ isCooldownActive: false });
  });

  it("handles malformed persisted state as a fresh protection record", async () => {
    const { recordPath, service } = await createService();
    await fs.promises.mkdir(path.dirname(recordPath), { recursive: true });
    await fs.promises.writeFile(recordPath, JSON.stringify({
      version: 1,
      stageIndex: "not-a-number",
      failedAttemptsInStage: "not-a-number",
      cooldownUntil: "not-a-date"
    }), "utf-8");

    await service.initialize();
    expect(service.getStatus()).toEqual({ isCooldownActive: false });
    await service.recordFailedAttempt();
    await service.recordFailedAttempt();
    expect((await service.recordFailedAttempt()).isCooldownActive).toBe(true);
  });

  it("counts concurrent failed attempts without losing the cooldown threshold", async () => {
    const { service } = await createService();

    const statuses = await Promise.all([
      service.recordFailedAttempt(),
      service.recordFailedAttempt(),
      service.recordFailedAttempt()
    ]);

    expect(statuses.at(-1)?.isCooldownActive).toBe(true);
    expect(service.getStatus().isCooldownActive).toBe(true);
  });
});

async function createService(): Promise<{ recordPath: string; service: BruteForceProtectionService }> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-brute-force-"));
  temporaryDirectories.push(directory);
  const recordPath = path.join(directory, "security", "brute-force.json");

  return {
    recordPath,
    service: new BruteForceProtectionService(recordPath)
  };
}
