/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";
import { RestoreService } from "../../../../electron/storage/RestoreService";
import { ValidatedBackupArchive } from "../../../../src/backup/restoreArchive";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { RestoreNotesMode } from "../../../../src/types/RestoreNotesMode";
import { RestoreSettingsMode } from "../../../../src/types/RestoreSettingsMode";
import { NoteService } from "../../../../electron/storage/NoteService";
import { SettingsService } from "../../../../electron/storage/SettingsService";
import { RestoreStateStorage } from "../../../../electron/storage/RestoreStateStorage";

describe("RestoreService", () => {
  it("replaces notes, preferences, layout, and restore history", async () => {
    const currentNotes = [createNote("current", "Current")];
    const archive = createArchive({
      appSettings: { ...defaultAppSettings, showTitles: false },
      contentSelection: { appSettings: true, mainWindowState: true },
      mainWindowState: { bounds: { height: 800, width: 1200 }, isMaximized: false }
    });
    const context = createContext(currentNotes);
    const writeWindowState = vi.fn().mockResolvedValue(undefined);
    const service = new RestoreService(
      context.noteService as unknown as NoteService,
      context.settingsService as unknown as SettingsService,
      context.restoreStateStorage as unknown as RestoreStateStorage,
      "main-window-state.json",
      () => new Date("2026-11-07T13:00:00.000Z"),
      vi.fn(() => ({ bounds: { height: 600, width: 900 }, isMaximized: true })),
      writeWindowState
    );

    await expect(service.applyRestore(archive, {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.RESTORE_BACKUP
    })).resolves.toEqual({ lastRestoredAt: "2026-11-07T13:00:00.000Z", version: 1 });

    expect(context.noteService.replaceNotes).toHaveBeenCalledWith(archive.notes, undefined);
    expect(context.settingsService.replaceSettings).toHaveBeenCalledWith(expect.objectContaining({ showTitles: false }));
    expect(writeWindowState).toHaveBeenCalledWith("main-window-state.json", archive.mainWindowState);
    expect(context.restoreStateStorage.setState).toHaveBeenCalledWith({ lastRestoredAt: "2026-11-07T13:00:00.000Z", version: 1 });
  });

  it("rolls back notes after a later settings failure", async () => {
    const currentNotes = [createNote("current", "Current")];
    const context = createContext(currentNotes);
    context.settingsService.replaceSettings.mockRejectedValueOnce(new Error("write failed"));
    const service = new RestoreService(
      context.noteService as unknown as NoteService,
      context.settingsService as unknown as SettingsService,
      context.restoreStateStorage as unknown as RestoreStateStorage,
      "main-window-state.json"
    );

    await expect(service.applyRestore(createArchive({ appSettings: defaultAppSettings }), {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.RESTORE_BACKUP
    })).rejects.toThrow("write failed");

    expect(context.noteService.replaceNotes).toHaveBeenNthCalledWith(1, [createNote("backup", "Backup")], undefined);
    expect(context.noteService.replaceNotes).toHaveBeenNthCalledWith(2, currentNotes, undefined);
  });

  it("keeps current preferences and window state when the selected modes preserve them", async () => {
    const currentNotes = [createNote("current", "Current")];
    const context = createContext(currentNotes);
    const writeWindowState = vi.fn();
    const service = new RestoreService(
      context.noteService as unknown as NoteService,
      context.settingsService as unknown as SettingsService,
      context.restoreStateStorage as unknown as RestoreStateStorage,
      "main-window-state.json",
      undefined,
      undefined,
      writeWindowState
    );

    await service.applyRestore(createArchive({
      appSettings: { ...defaultAppSettings, showTitles: false },
      mainWindowState: { bounds: { height: 800, width: 1200 }, isMaximized: true }
    }), {
      notesMode: RestoreNotesMode.ADD_TO_CURRENT,
      settingsMode: RestoreSettingsMode.KEEP_CURRENT
    });

    expect(context.settingsService.replaceSettings).not.toHaveBeenCalled();
    expect(writeWindowState).not.toHaveBeenCalled();
    expect(context.noteService.replaceNotes).toHaveBeenCalledWith([currentNotes[0], createNote("backup", "Backup")], undefined);
  });

  it("rolls back window state, preferences, and notes when writing restore history fails", async () => {
    const currentNotes = [createNote("current", "Current")];
    const currentSettings = { ...defaultAppSettings, showTitles: true };
    const currentWindowState = { bounds: { height: 600, width: 900 }, isMaximized: false };
    const restoredWindowState = { bounds: { height: 800, width: 1200 }, isMaximized: true };
    const context = createContext(currentNotes, currentSettings);
    context.restoreStateStorage.setState.mockRejectedValueOnce(new Error("history write failed"));
    const writeWindowState = vi.fn().mockResolvedValue(undefined);
    const service = new RestoreService(
      context.noteService as unknown as NoteService,
      context.settingsService as unknown as SettingsService,
      context.restoreStateStorage as unknown as RestoreStateStorage,
      "main-window-state.json",
      undefined,
      vi.fn(() => currentWindowState),
      writeWindowState
    );

    await expect(service.applyRestore(createArchive({
      appSettings: { ...defaultAppSettings, showTitles: false },
      mainWindowState: restoredWindowState
    }), {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      settingsMode: RestoreSettingsMode.RESTORE_BACKUP
    })).rejects.toThrow("history write failed");

    expect(writeWindowState).toHaveBeenNthCalledWith(1, "main-window-state.json", restoredWindowState);
    expect(writeWindowState).toHaveBeenNthCalledWith(2, "main-window-state.json", currentWindowState);
    expect(context.settingsService.replaceSettings).toHaveBeenNthCalledWith(1, expect.objectContaining({ showTitles: false }));
    expect(context.settingsService.replaceSettings).toHaveBeenNthCalledWith(2, currentSettings);
    expect(context.noteService.replaceNotes).toHaveBeenNthCalledWith(2, currentNotes, undefined);
  });

  it("uses the current encryption password for both inspection and replacement", async () => {
    const context = createContext([createNote("current", "Current")]);
    const service = new RestoreService(
      context.noteService as unknown as NoteService,
      context.settingsService as unknown as SettingsService,
      context.restoreStateStorage as unknown as RestoreStateStorage,
      "main-window-state.json"
    );

    await service.inspectRestore(createArchive(), "current password");
    await service.applyRestore(createArchive(), {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      password: "current password",
      settingsMode: RestoreSettingsMode.KEEP_CURRENT
    });

    expect(context.noteService.getNotesForBackup).toHaveBeenCalledWith("current password");
    expect(context.noteService.replaceNotes).toHaveBeenCalledWith([createNote("backup", "Backup")], "current password");
  });
});

function createContext(currentNotes: ReturnType<typeof createNote>[], currentSettings = defaultAppSettings) {
  return {
    noteService: {
      getNotesForBackup: vi.fn().mockResolvedValue(currentNotes),
      replaceNotes: vi.fn().mockResolvedValue(undefined)
    },
    restoreStateStorage: {
      setState: vi.fn().mockResolvedValue(undefined)
    },
    settingsService: {
      getSettings: vi.fn().mockResolvedValue(currentSettings),
      replaceSettings: vi.fn().mockResolvedValue(undefined)
    }
  };
}

function createArchive(overrides: Partial<ValidatedBackupArchive> = {}): ValidatedBackupArchive {
  return {
    contentSelection: { appSettings: false, mainWindowState: false },
    createdAt: "2026-11-07T12:00:00.000Z",
    noteOrder: ["backup"],
    notes: [createNote("backup", "Backup")],
    ...overrides
  };
}

function createNote(id: string, content: string) {
  return {
    bgcolor: "yellow" as const,
    content,
    createdOn: new Date("2026-11-07T10:00:00.000Z"),
    id,
    lastModifiedOn: new Date("2026-11-07T11:00:00.000Z")
  };
}
