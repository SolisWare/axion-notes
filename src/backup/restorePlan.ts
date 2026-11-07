/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../types/NoteType";
import { RestoreNotesMode } from "../types/RestoreNotesMode";
import { RestorePlan } from "../types/RestorePlan";
import { RestoreSettingsMode } from "../types/RestoreSettingsMode";
import { BackupSource } from "../types/BackupSource";
import { ValidatedBackupArchive } from "./restoreArchive";
import { areNotesEqual } from "./backupValidation";

export type RestorePlanOptions = {
  currentNotes: readonly NoteType[];
  destination: BackupSource;
  isNotesEncryptionEnabled: boolean;
};

/**
 * Builds a non-destructive restore preview for a validated backup archive.
 */
export function createRestorePlan(archive: ValidatedBackupArchive, options: RestorePlanOptions): RestorePlan {
  const notesById = new Map(options.currentNotes.map((note) => [note.id, note]));
  const { conflictingNotesCount, identicalNotesCount } = getNoteCollisionCounts(archive.notes, notesById);
  const hasCurrentNotes = options.currentNotes.length > 0;
  const hasBackupPreferences = archive.appSettings !== undefined;
  const preferencesCanBeRestored = hasBackupPreferences && archive.source === options.destination;

  return {
    archiveCreatedAt: archive.createdAt,
    backupSource: archive.source,
    conflictingNotesCount,
    currentNotesCount: options.currentNotes.length,
    defaultNotesMode: hasCurrentNotes ? RestoreNotesMode.ADD_TO_CURRENT : RestoreNotesMode.REPLACE_CURRENT,
    defaultSettingsMode: hasCurrentNotes || !preferencesCanBeRestored ? RestoreSettingsMode.KEEP_CURRENT : RestoreSettingsMode.RESTORE_BACKUP,
    hasBackupPreferences,
    preferencesCanBeRestored,
    hasMainWindowState: archive.mainWindowState !== undefined,
    identicalNotesCount,
    incomingNotesCount: archive.notes.length,
    requiresCurrentPassword: options.isNotesEncryptionEnabled,
    requiresNotesModeSelection: hasCurrentNotes,
    requiresSettingsModeSelection: preferencesCanBeRestored && hasCurrentNotes
  };
}

function getNoteCollisionCounts(incomingNotes: readonly NoteType[], currentNotesById: ReadonlyMap<string, NoteType>): { conflictingNotesCount: number; identicalNotesCount: number } {
  let conflictingNotesCount = 0;
  let identicalNotesCount = 0;

  for (const incomingNote of incomingNotes) {
    const currentNote = currentNotesById.get(incomingNote.id);

    if (!currentNote) {
      continue;
    }

    if (areNotesEqual(currentNote, incomingNote)) {
      identicalNotesCount += 1;
    } else {
      conflictingNotesCount += 1;
    }
  }

  return { conflictingNotesCount, identicalNotesCount };
}

