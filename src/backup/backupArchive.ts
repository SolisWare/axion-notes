/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppSettings } from "../settings/AppSettings";
import { AppWindowState } from "../settings/AppWindowState";
import { BackupContentSelection } from "../types/BackupContentSelection";
import { NoteType } from "../types/NoteType";

export const BACKUP_ARCHIVE_FILE_NAME = "axion-notes-backup.zip";
export const BACKUP_MANIFEST_VERSION = 1;

export type BackupArchiveEntry = {
  fileName: string;
  value: unknown;
};

export type BackupManifest = {
  version: typeof BACKUP_MANIFEST_VERSION;
  createdAt: string;
  contentSelection: BackupContentSelection;
};

export type BackupArchiveContent = {
  appSettings?: AppSettings;
  contentSelection: BackupContentSelection;
  createdAt: string;
  mainWindowState?: AppWindowState;
  notes: NoteType[];
};

/**
 * Creates the platform-independent JSON entries for a plaintext Axion Notes backup archive.
 */
export function createBackupArchiveEntries(content: BackupArchiveContent): BackupArchiveEntry[] {
  const entries: BackupArchiveEntry[] = [
    {
      fileName: "manifest.json",
      value: {
        version: BACKUP_MANIFEST_VERSION,
        createdAt: content.createdAt,
        contentSelection: content.contentSelection
      } satisfies BackupManifest
    },
    { fileName: "notes.json", value: content.notes },
    { fileName: "note-order.json", value: content.notes.map((note) => note.id) }
  ];

  if (content.contentSelection.appSettings && content.appSettings) {
    entries.push({
      fileName: "app-preferences.json",
      value: getBackupPreferences(content.appSettings)
    });
  }

  if (content.contentSelection.mainWindowState && content.mainWindowState) {
    entries.push({
      fileName: "main-window-state.json",
      value: content.mainWindowState
    });
  }

  return entries;
}

/**
 * Removes security configuration that must never be included in a plaintext backup.
 */
export function getBackupPreferences(settings: AppSettings): Omit<AppSettings,
  "bruteForceProtectionEnabled"
  | "lockScreenContentProtectionEnabled"
  | "lockScreenEnabled"
  | "lockScreenIdleTimeout"
  | "lockScreenOnSystemSleepEnabled"
  | "lockScreenRequirePasswordDelay"
  | "notesEncryptionEnabled"
> {
  const {
    bruteForceProtectionEnabled: _bruteForceProtectionEnabled,
    lockScreenContentProtectionEnabled: _lockScreenContentProtectionEnabled,
    lockScreenEnabled: _lockScreenEnabled,
    lockScreenIdleTimeout: _lockScreenIdleTimeout,
    lockScreenOnSystemSleepEnabled: _lockScreenOnSystemSleepEnabled,
    lockScreenRequirePasswordDelay: _lockScreenRequirePasswordDelay,
    notesEncryptionEnabled: _notesEncryptionEnabled,
    ...preferences
  } = settings;

  return preferences;
}
