/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { getBackupPreferences } from "../../../src/backup/backupArchive";
import { prepareRestoredSettings } from "../../../src/backup/restoreSettings";
import { defaultAppSettings } from "../../../src/settings/defaultSettings";
import { AppThemePreference } from "../../../src/settings/AppThemePreference";
import { ClipboardClearDelay } from "../../../src/settings/ClipboardClearDelay";
import { RestoreSettingsMode } from "../../../src/types/RestoreSettingsMode";

describe("restoreSettings", () => {
  it("keeps every destination setting when current preferences are retained", () => {
    const currentSettings = {
      ...defaultAppSettings,
      notesEncryptionEnabled: true,
      theme: AppThemePreference.DARK
    };

    expect(prepareRestoredSettings(currentSettings, getBackupPreferences(defaultAppSettings), RestoreSettingsMode.KEEP_CURRENT)).toEqual(currentSettings);
  });

  it("restores backup preferences while preserving all local security settings", () => {
    const currentSettings = {
      ...defaultAppSettings,
      bruteForceProtectionEnabled: false,
      clipboardClearDelay: ClipboardClearDelay.THIRTY_SECONDS,
      clearCopiedTextOnLockEnabled: false,
      lockScreenContentProtectionEnabled: false,
      lockScreenEnabled: true,
      lockScreenIdleTimeout: 60,
      lockScreenOnSystemSleepEnabled: false,
      lockScreenRequirePasswordDelay: 30,
      notesEncryptionEnabled: true
    };
    const backupSettings = {
      ...defaultAppSettings,
      clipboardClearDelay: ClipboardClearDelay.TEN_MINUTES,
      clearCopiedTextOnLockEnabled: true,
      theme: AppThemePreference.DARK,
      showTitles: false
    };

    const restoredSettings = prepareRestoredSettings(currentSettings, getBackupPreferences(backupSettings), RestoreSettingsMode.RESTORE_BACKUP);

    expect(restoredSettings).toMatchObject({
      theme: AppThemePreference.DARK,
      showTitles: false,
      clipboardClearDelay: ClipboardClearDelay.TEN_MINUTES,
      clearCopiedTextOnLockEnabled: true,
      bruteForceProtectionEnabled: false,
      lockScreenContentProtectionEnabled: false,
      lockScreenEnabled: true,
      lockScreenIdleTimeout: 60,
      lockScreenOnSystemSleepEnabled: false,
      lockScreenRequirePasswordDelay: 30,
      notesEncryptionEnabled: true
    });
  });

  it("rejects restoring preferences when the backup does not contain them", () => {
    expect(() => prepareRestoredSettings(defaultAppSettings, undefined, RestoreSettingsMode.RESTORE_BACKUP)).toThrow("does not contain restorable preferences");
  });
});
