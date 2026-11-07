/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppSettings } from "../settings/AppSettings";
import { RestoreSettingsMode } from "../types/RestoreSettingsMode";
import { BackupPreferences } from "./restoreArchive";

/**
 * Produces the destination settings after the selected restore preference mode.
 */
export function prepareRestoredSettings(
  currentSettings: AppSettings,
  backupPreferences: BackupPreferences | undefined,
  mode: RestoreSettingsMode
): AppSettings {
  if (mode === RestoreSettingsMode.KEEP_CURRENT) {
    return { ...currentSettings };
  }

  if (!backupPreferences) {
    throw new Error("Backup archive does not contain restorable preferences.");
  }

  return {
    ...backupPreferences,
    bruteForceProtectionEnabled: currentSettings.bruteForceProtectionEnabled,
    lockScreenContentProtectionEnabled: currentSettings.lockScreenContentProtectionEnabled,
    lockScreenEnabled: currentSettings.lockScreenEnabled,
    lockScreenIdleTimeout: currentSettings.lockScreenIdleTimeout,
    lockScreenOnSystemSleepEnabled: currentSettings.lockScreenOnSystemSleepEnabled,
    lockScreenRequirePasswordDelay: currentSettings.lockScreenRequirePasswordDelay,
    notesEncryptionEnabled: currentSettings.notesEncryptionEnabled
  };
}
