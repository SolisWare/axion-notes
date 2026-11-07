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
import { ValidatedBackupArchive } from "./restoreArchive";

export type RestorePlanOptions = {
  currentNotes: readonly NoteType[];
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

  return {
    archiveCreatedAt: archive.createdAt,
    conflictingNotesCount,
    currentNotesCount: options.currentNotes.length,
    defaultNotesMode: hasCurrentNotes ? undefined : RestoreNotesMode.REPLACE_CURRENT,
    defaultSettingsMode: hasCurrentNotes || !hasBackupPreferences ? undefined : RestoreSettingsMode.RESTORE_BACKUP,
    hasBackupPreferences,
    hasMainWindowState: archive.mainWindowState !== undefined,
    identicalNotesCount,
    incomingNotesCount: archive.notes.length,
    requiresCurrentPassword: options.isNotesEncryptionEnabled,
    requiresNotesModeSelection: hasCurrentNotes,
    requiresSettingsModeSelection: hasBackupPreferences && hasCurrentNotes
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

function areNotesEqual(first: NoteType, second: NoteType): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}
