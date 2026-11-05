/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BackupState } from "../../src/types/BackupState";
import { BackupService } from "../storage/BackupService";
import { LockStateService } from "../security/LockStateService";
import { channels } from "./channels";
import { protectedHandle } from "./protectedIpc";

type BackupIpcOptions = {
  backupService: BackupService;
  lockStateService: LockStateService;
};

export function registerBackupIpc(options: BackupIpcOptions): void {
  protectedHandle<BackupState | undefined, []>(channels.backup.getState, { ...options, fallback: undefined }, async () => {
    return options.backupService.getState();
  });

  protectedHandle<BackupState | undefined, []>(channels.backup.initialize, { ...options, fallback: undefined }, async () => {
    try {
      return await options.backupService.initialize();
    } catch (err) {
      console.warn("Failed to initialize backups:", err);
      return undefined;
    }
  });
}
