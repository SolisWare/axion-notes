/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFile } from "node:child_process";
import { isWindows } from "../utils/Platform";

const LOCK_MARKER_VERSION = 1;

type LockMarker = {
  version: typeof LOCK_MARKER_VERSION;
  lockConfigured: true;
};

/**
 * Manages the redundant hidden lock marker used to remember that the lock
 * screen was configured even if app settings are removed or edited.
 */
export class LockMarkerService {
  public constructor(private readonly lockMarkerPath: string) {
  }

  /**
   * Checks whether the lock marker exists.
   *
   * @returns true when the marker exists; otherwise false.
   */
  public async hasLockMarker(): Promise<boolean> {
    try {
      await fs.promises.access(this.lockMarkerPath, fs.constants.F_OK);
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      throw err;
    }
  }

  /**
   * Writes the lock marker to disk.
   */
  public async writeLockMarker(): Promise<void> {
    const marker: LockMarker = {
      version: LOCK_MARKER_VERSION,
      lockConfigured: true
    };

    await fs.promises.mkdir(path.dirname(this.lockMarkerPath), { recursive: true });
    await fs.promises.writeFile(this.lockMarkerPath, JSON.stringify(marker, null, 2), "utf-8");
    await this.hideLockMarkerOnWindows();
  }

  /**
   * Removes the lock marker if it exists.
   */
  public async removeLockMarker(): Promise<void> {
    try {
      await fs.promises.unlink(this.lockMarkerPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }

      throw err;
    }
  }

  private async hideLockMarkerOnWindows(): Promise<void> {
    if (!isWindows) {
      return;
    }

    return new Promise((resolve) => {
      execFile("attrib", ["+h", this.lockMarkerPath], (err) => {
        if (err) {
          console.error("Failed to hide lock marker on Windows:", err);
        }

        resolve();
      });
    });
  }
}
