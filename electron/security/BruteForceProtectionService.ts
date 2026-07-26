/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const BRUTE_FORCE_PROTECTION_RECORD_VERSION = 1;

type BruteForceProtectionStage = {
  attempts: number;
  cooldownMs: number;
};

type BruteForceProtectionRecord = {
  version: typeof BRUTE_FORCE_PROTECTION_RECORD_VERSION;
  stageIndex: number;
  failedAttemptsInStage: number;
  cooldownUntil?: string;
};

type BruteForceProtectionStatus = {
  isCooldownActive: boolean;
  cooldownUntil?: string;
};

/**
 * Escalating cooldown schedule for incorrect lock-password attempts.
 *
 * Level 1: 3 incorrect attempts trigger a 1 minute cooldown.
 * Level 2: 2 more incorrect attempts trigger a 5 minute cooldown.
 * Level 3: 1 more incorrect attempt triggers a 10 minute cooldown.
 * Level 4: 3 more incorrect attempts trigger a 30 minute cooldown.
 * Level 5: 2 more incorrect attempts trigger a 1 hour cooldown.
 * Level 6: 1 more incorrect attempt triggers a 24 hour cooldown.
 *
 * After level 6, the service stays at level 6, so each additional incorrect
 * attempt after a completed cooldown triggers another 24 hour cooldown.
 */
const BRUTE_FORCE_PROTECTION_STAGES: readonly BruteForceProtectionStage[] = [
  { attempts: 3, cooldownMs: 1 * 60 * 1000 },
  { attempts: 2, cooldownMs: 5 * 60 * 1000 },
  { attempts: 1, cooldownMs: 10 * 60 * 1000 },
  { attempts: 3, cooldownMs: 30 * 60 * 1000 },
  { attempts: 2, cooldownMs: 60 * 60 * 1000 },
  { attempts: 1, cooldownMs: 24 * 60 * 60 * 1000 }
];

/**
 * Tracks failed lock-password attempts and escalating cooldown periods.
 *
 * This service is owned by the Electron main process. Renderer code never
 * receives attempt counters, only whether an unlock attempt is currently
 * blocked and when the cooldown ends.
 */
export class BruteForceProtectionService {
  private record: BruteForceProtectionRecord = this.createEmptyRecord();

  public constructor(private readonly recordPath: string) {
  }

  /**
   * Loads any persisted failed-attempt state from disk.
   */
  public async initialize(): Promise<void> {
    this.record = await this.readRecord();
  }

  /**
   * Returns whether password attempts are currently blocked by a cooldown.
   */
  public getStatus(): BruteForceProtectionStatus {
    return this.getStatusAt(Date.now());
  }

  /**
   * Records a failed password attempt and starts the next cooldown when the
   * current stage threshold is reached.
   */
  public async recordFailedAttempt(): Promise<BruteForceProtectionStatus> {
    const currentStatus = this.getStatus();

    if (currentStatus.isCooldownActive) {
      return currentStatus;
    }

    const stageIndex = this.getSafeStageIndex(this.record.stageIndex);
    const stage = BRUTE_FORCE_PROTECTION_STAGES[stageIndex];
    this.record.failedAttemptsInStage += 1;

    if (this.record.failedAttemptsInStage >= stage.attempts) {
      this.record.cooldownUntil = new Date(Date.now() + stage.cooldownMs).toISOString();
      this.record.stageIndex = this.getSafeStageIndex(stageIndex + 1);
      this.record.failedAttemptsInStage = 0;
    }

    await this.writeRecord();
    return this.getStatus();
  }

  /**
   * Clears failed-attempt and cooldown state after successful unlock or when
   * brute-force protection is disabled.
   */
  public async reset(): Promise<void> {
    this.record = this.createEmptyRecord();

    try {
      await fs.promises.unlink(this.recordPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }

      throw err;
    }
  }

  private getStatusAt(now: number): BruteForceProtectionStatus {
    const cooldownUntil = this.record.cooldownUntil;

    if (!cooldownUntil) {
      return {
        isCooldownActive: false
      };
    }

    if (Date.parse(cooldownUntil) <= now) {
      this.record.cooldownUntil = undefined;
      void this.writeRecord();
      return {
        isCooldownActive: false
      };
    }

    return {
      isCooldownActive: true,
      cooldownUntil
    };
  }

  private async readRecord(): Promise<BruteForceProtectionRecord> {
    try {
      const content = await fs.promises.readFile(this.recordPath, "utf-8");
      const record = JSON.parse(content) as BruteForceProtectionRecord;

      if (record.version !== BRUTE_FORCE_PROTECTION_RECORD_VERSION) {
        return this.createEmptyRecord();
      }

      return {
        version: BRUTE_FORCE_PROTECTION_RECORD_VERSION,
        stageIndex: this.getSafeStageIndex(record.stageIndex),
        failedAttemptsInStage: Math.max(0, record.failedAttemptsInStage),
        cooldownUntil: record.cooldownUntil
      };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return this.createEmptyRecord();
      }

      console.warn("Failed to load brute-force protection state:", err);
      return this.createEmptyRecord();
    }
  }

  private async writeRecord(): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.recordPath), { recursive: true });
    await fs.promises.writeFile(this.recordPath, JSON.stringify(this.record, null, 2), "utf-8");
  }

  private createEmptyRecord(): BruteForceProtectionRecord {
    return {
      version: BRUTE_FORCE_PROTECTION_RECORD_VERSION,
      stageIndex: 0,
      failedAttemptsInStage: 0
    };
  }

  private getSafeStageIndex(stageIndex: number): number {
    return Math.min(Math.max(0, stageIndex), BRUTE_FORCE_PROTECTION_STAGES.length - 1);
  }
}
