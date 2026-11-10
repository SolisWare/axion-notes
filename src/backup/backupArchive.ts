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
import { BackupSource } from "../types/BackupSource";

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
  source?: BackupSource;
};

export type BackupArchiveContent = {
  appSettings?: AppSettings;
  contentSelection: BackupContentSelection;
  createdAt: string;
  mainWindowState?: AppWindowState;
  notes: NoteType[];
  source?: BackupSource;
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
        contentSelection: content.contentSelection,
        source: content.source ?? BackupSource.UNKNOWN
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
  return {
    contentFontSize: settings.contentFontSize,
    dateFormat: settings.dateFormat,
    defaultNoteColor: settings.defaultNoteColor,
    keepNotesMainWindowOnTop: settings.keepNotesMainWindowOnTop,
    language: settings.language,
    noteFont: settings.noteFont,
    noteLayout: settings.noteLayout,
    noteSize: settings.noteSize,
    notesSortOrder: settings.notesSortOrder,
    richTextEditorEnabled: settings.richTextEditorEnabled,
    showFloatingFormatToolbar: settings.showFloatingFormatToolbar,
    showNoteFooters: settings.showNoteFooters,
    showTitles: settings.showTitles,
    showWelcomeScreenOnLaunch: settings.showWelcomeScreenOnLaunch,
    theme: settings.theme,
    timeFormat: settings.timeFormat,
    titleFont: settings.titleFont,
    titleFontSize: settings.titleFontSize
  };
}

/**
 * Determines whether two backup-safe preference sets have identical values.
 */
export function areBackupPreferencesEqual(
  first: ReturnType<typeof getBackupPreferences>,
  second: ReturnType<typeof getBackupPreferences>
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}
