/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { createRestorePlan } from "../../../src/backup/restorePlan";
import { ValidatedBackupArchive } from "../../../src/backup/restoreArchive";
import { RestoreNotesMode } from "../../../src/types/RestoreNotesMode";
import { RestoreSettingsMode } from "../../../src/types/RestoreSettingsMode";
import { BackupSource } from "../../../src/types/BackupSource";
import { getBackupPreferences } from "../../../src/backup/backupArchive";
import { defaultAppSettings } from "../../../src/settings/defaultSettings";
import { NoteType } from "../../../src/types/NoteType";

describe("restorePlan", () => {
  it("preselects replacement and backup preferences for an empty destination", () => {
    const plan = createRestorePlan(createArchive({ appSettings: getBackupPreferences(defaultAppSettings) }), {
      currentSettings: defaultAppSettings,
      currentNotes: [],
      destination: BackupSource.DESKTOP,
      isNotesEncryptionEnabled: false
    });

    expect(plan).toEqual({
      archiveCreatedAt: "2026-11-07T12:00:00.000Z",
      backupSource: BackupSource.DESKTOP,
      conflictingNotesCount: 0,
      currentNotesCount: 0,
      defaultNotesMode: RestoreNotesMode.REPLACE_CURRENT,
      defaultSettingsMode: RestoreSettingsMode.RESTORE_BACKUP,
      hasBackupPreferences: true,
      hasNotesConflict: false,
      hasPreferencesConflict: false,
      preferencesCanBeRestored: true,
      hasMainWindowState: false,
      identicalNotesCount: 0,
      incomingNotesCount: 2,
      requiresCurrentPassword: false,
      requiresNotesModeSelection: false,
      requiresSettingsModeSelection: false
    });
  });

  it("preselects additive restore choices for a used destination and distinguishes identical from conflicting notes", () => {
    const archive = createArchive();
    const plan = createRestorePlan(archive, {
      currentSettings: defaultAppSettings,
      currentNotes: [
        archive.notes[0],
        { ...archive.notes[1], content: "Current version" },
        createNote("current-only", "Current-only note")
      ],
      destination: BackupSource.DESKTOP,
      isNotesEncryptionEnabled: true
    });

    expect(plan).toMatchObject({
      conflictingNotesCount: 1,
      currentNotesCount: 3,
      defaultNotesMode: RestoreNotesMode.ADD_TO_CURRENT,
      defaultSettingsMode: RestoreSettingsMode.KEEP_CURRENT,
      hasBackupPreferences: false,
      hasNotesConflict: true,
      identicalNotesCount: 1,
      incomingNotesCount: 2,
      requiresCurrentPassword: true,
      requiresNotesModeSelection: true,
      requiresSettingsModeSelection: false
    });
  });

  it("requires a preference choice only when backup preferences differ from the installed app", () => {
    const plan = createRestorePlan(createArchive({
      appSettings: getBackupPreferences({ ...defaultAppSettings, showTitles: false })
    }), {
      currentSettings: defaultAppSettings,
      currentNotes: [createNote("current-note", "Current note")],
      destination: BackupSource.DESKTOP,
      isNotesEncryptionEnabled: false
    });

    expect(plan.hasBackupPreferences).toBe(true);
    expect(plan.requiresSettingsModeSelection).toBe(true);
    expect(plan.defaultSettingsMode).toBe(RestoreSettingsMode.KEEP_CURRENT);
  });

  it("does not require merge choices when the installed notes and preferences already match the backup", () => {
    const archive = createArchive({ appSettings: getBackupPreferences(defaultAppSettings) });
    const plan = createRestorePlan(archive, {
      currentSettings: defaultAppSettings,
      currentNotes: archive.notes,
      destination: BackupSource.DESKTOP,
      isNotesEncryptionEnabled: false
    });

    expect(plan).toMatchObject({
      defaultNotesMode: RestoreNotesMode.REPLACE_CURRENT,
      defaultSettingsMode: RestoreSettingsMode.RESTORE_BACKUP,
      hasNotesConflict: false,
      hasPreferencesConflict: false,
      requiresNotesModeSelection: false,
      requiresSettingsModeSelection: false
    });
  });

  it("requires a note choice when otherwise identical notes are in a different order", () => {
    const archive = createArchive({ appSettings: getBackupPreferences(defaultAppSettings) });
    const plan = createRestorePlan(archive, {
      currentSettings: defaultAppSettings,
      currentNotes: [...archive.notes].reverse(),
      destination: BackupSource.DESKTOP,
      isNotesEncryptionEnabled: false
    });

    expect(plan).toMatchObject({
      conflictingNotesCount: 0,
      hasNotesConflict: true,
      identicalNotesCount: 2,
      requiresNotesModeSelection: true
    });
  });

  it("keeps preferences when a backup was created on a different platform", () => {
    const plan = createRestorePlan(createArchive({
      appSettings: getBackupPreferences(defaultAppSettings),
      source: BackupSource.WEB
    }), {
      currentSettings: defaultAppSettings,
      currentNotes: [],
      destination: BackupSource.DESKTOP,
      isNotesEncryptionEnabled: false
    });

    expect(plan.hasBackupPreferences).toBe(true);
    expect(plan.hasPreferencesConflict).toBe(false);
    expect(plan.preferencesCanBeRestored).toBe(false);
    expect(plan.defaultSettingsMode).toBe(RestoreSettingsMode.KEEP_CURRENT);
    expect(plan.requiresSettingsModeSelection).toBe(false);
  });
});

function createArchive(overrides: Partial<ValidatedBackupArchive> = {}): ValidatedBackupArchive {
  return {
    contentSelection: { appSettings: false, mainWindowState: false },
    createdAt: "2026-11-07T12:00:00.000Z",
    noteOrder: ["note-1", "note-2"],
    notes: [createNote("note-1", "First note"), createNote("note-2", "Second note")],
    source: BackupSource.DESKTOP,
    ...overrides
  };
}

function createNote(id: string, content: string): NoteType {
  return {
    bgcolor: "yellow",
    content,
    createdOn: new Date("2026-11-07T10:00:00.000Z"),
    id,
    lastModifiedOn: new Date("2026-11-07T11:00:00.000Z")
  };
}
