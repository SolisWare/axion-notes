/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { RestoreNotesMode } from "./RestoreNotesMode";
import { RestoreSettingsMode } from "./RestoreSettingsMode";

export type RestorePlan = {
  archiveCreatedAt: string;
  conflictingNotesCount: number;
  currentNotesCount: number;
  defaultNotesMode?: RestoreNotesMode;
  defaultSettingsMode?: RestoreSettingsMode;
  hasBackupPreferences: boolean;
  hasMainWindowState: boolean;
  identicalNotesCount: number;
  incomingNotesCount: number;
  requiresCurrentPassword: boolean;
  requiresNotesModeSelection: boolean;
  requiresSettingsModeSelection: boolean;
};
