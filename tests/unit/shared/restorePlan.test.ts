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
import { defaultAppSettings } from "../../../src/settings/defaultSettings";
import { NoteType } from "../../../src/types/NoteType";

describe("restorePlan", () => {
  it("preselects replacement and backup preferences for an empty destination", () => {
    const plan = createRestorePlan(createArchive({ appSettings: defaultAppSettings }), {
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
      identicalNotesCount: 1,
      incomingNotesCount: 2,
      requiresCurrentPassword: true,
      requiresNotesModeSelection: true,
      requiresSettingsModeSelection: false
    });
  });

  it("keeps current preferences by default when both settings and current notes exist", () => {
    const plan = createRestorePlan(createArchive({ appSettings: defaultAppSettings }), {
      currentNotes: [createNote("current-note", "Current note")],
      destination: BackupSource.DESKTOP,
      isNotesEncryptionEnabled: false
    });

    expect(plan.hasBackupPreferences).toBe(true);
    expect(plan.requiresSettingsModeSelection).toBe(true);
    expect(plan.defaultSettingsMode).toBe(RestoreSettingsMode.KEEP_CURRENT);
  });

  it("keeps preferences when a backup was created on a different platform", () => {
    const plan = createRestorePlan(createArchive({
      appSettings: defaultAppSettings,
      source: BackupSource.WEB
    }), {
      currentNotes: [],
      destination: BackupSource.DESKTOP,
      isNotesEncryptionEnabled: false
    });

    expect(plan.hasBackupPreferences).toBe(true);
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
