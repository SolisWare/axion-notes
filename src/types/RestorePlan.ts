/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { RestoreNotesMode } from "./RestoreNotesMode";
import { RestoreSettingsMode } from "./RestoreSettingsMode";
import { BackupSource } from "./BackupSource";

export type RestorePlan = {
  archiveCreatedAt: string;
  backupSource: BackupSource;
  conflictingNotesCount: number;
  currentNotesCount: number;
  defaultNotesMode?: RestoreNotesMode;
  defaultSettingsMode?: RestoreSettingsMode;
  hasBackupPreferences: boolean;
  preferencesCanBeRestored: boolean;
  hasMainWindowState: boolean;
  identicalNotesCount: number;
  incomingNotesCount: number;
  requiresCurrentPassword: boolean;
  requiresNotesModeSelection: boolean;
  requiresSettingsModeSelection: boolean;
};
