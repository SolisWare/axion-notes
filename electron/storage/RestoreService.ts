/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as crypto from "node:crypto";
import { ValidatedBackupArchive } from "../../src/backup/restoreArchive";
import { prepareRestoredNotes } from "../../src/backup/restoreNotes";
import { prepareRestoredSettings } from "../../src/backup/restoreSettings";
import { createRestorePlan } from "../../src/backup/restorePlan";
import { AppSettings } from "../../src/settings/AppSettings";
import { AppWindowState } from "../../src/settings/AppWindowState";
import { defaultAppSettings } from "../../src/settings/defaultSettings";
import { NoteType } from "../../src/types/NoteType";
import { RestoreApplyOptions } from "../../src/types/RestoreApplyOptions";
import { RestoreSettingsMode } from "../../src/types/RestoreSettingsMode";
import { RestoreState } from "../../src/types/RestoreState";
import { RestorePlan } from "../../src/types/RestorePlan";
import { readMainWindowState, replaceMainWindowState } from "../windows/mainWindowState";
import { NoteService } from "./NoteService";
import { RestoreStateStorage } from "./RestoreStateStorage";
import { SettingsService } from "./SettingsService";

type ReadWindowState = (filePath: string) => AppWindowState;
type WriteWindowState = (filePath: string, state: AppWindowState) => Promise<void>;

/**
 * Applies a validated desktop backup while preserving destination security settings.
 */
export class RestoreService {

  public constructor(
    private readonly noteService: NoteService,
    private readonly settingsService: SettingsService,
    private readonly restoreStateStorage: RestoreStateStorage,
    private readonly mainWindowStateFilePath: string,
    private readonly getCurrentDate: () => Date = () => new Date(),
    private readonly readWindowState: ReadWindowState = readMainWindowState,
    private readonly writeWindowState: WriteWindowState = replaceMainWindowState
  ) {
  }

  /**
   * Applies a validated archive and records its successful completion.
   */
  public async applyRestore(archive: ValidatedBackupArchive, options: RestoreApplyOptions): Promise<RestoreState> {
    const currentNotes = await this.noteService.getNotesForBackup(options.password);
    const currentSettings = await this.settingsService.getSettings() ?? defaultAppSettings;
    const shouldRestoreSettings = options.settingsMode === RestoreSettingsMode.RESTORE_BACKUP;
    const currentWindowState = shouldRestoreSettings && archive.mainWindowState
      ? this.readWindowState(this.mainWindowStateFilePath)
      : undefined;
    const nextNotes = prepareRestoredNotes(archive, currentNotes, options.notesMode, () => crypto.randomUUID()).notes;
    const nextSettings = prepareRestoredSettings(currentSettings, archive.appSettings, options.settingsMode);
    const state: RestoreState = {
      lastRestoredAt: this.getCurrentDate().toISOString(),
      version: 1
    };
    let shouldRestorePreviousNotes = false;
    let didRestoreSettings = false;
    let didRestoreWindowState = false;

    try {
      shouldRestorePreviousNotes = true;
      await this.noteService.replaceNotes(nextNotes, options.password);

      if (shouldRestoreSettings) {
        await this.settingsService.replaceSettings(nextSettings);
        didRestoreSettings = true;
      }

      if (shouldRestoreSettings && archive.mainWindowState) {
        await this.writeWindowState(this.mainWindowStateFilePath, archive.mainWindowState);
        didRestoreWindowState = true;
      }

      await this.restoreStateStorage.setState(state);
      return state;
    } catch (err) {
      await this.restorePreviousState({
        currentNotes,
        currentSettings,
        currentWindowState,
        didRestoreSettings,
        didRestoreWindowState,
        password: options.password,
        shouldRestorePreviousNotes
      });
      throw err;
    }
  }

  /**
   * Returns a non-destructive review plan for a validated archive.
   */
  public async inspectRestore(archive: ValidatedBackupArchive, password?: string): Promise<RestorePlan> {
    const currentNotes = await this.noteService.getNotesForBackup(password);
    const currentSettings = await this.settingsService.getSettings() ?? defaultAppSettings;

    return createRestorePlan(archive, {
      currentNotes,
      isNotesEncryptionEnabled: currentSettings.notesEncryptionEnabled
    });
  }

  private async restorePreviousState(options: {
    currentNotes: NoteType[];
    currentSettings: AppSettings;
    currentWindowState: AppWindowState | undefined;
    didRestoreSettings: boolean;
    didRestoreWindowState: boolean;
    password: string | undefined;
    shouldRestorePreviousNotes: boolean;
  }): Promise<void> {
    const rollbackOperations: Array<() => Promise<void>> = [];

    if (options.didRestoreWindowState && options.currentWindowState) {
      rollbackOperations.push(() => this.writeWindowState(this.mainWindowStateFilePath, options.currentWindowState!));
    }

    if (options.didRestoreSettings) {
      rollbackOperations.push(() => this.settingsService.replaceSettings(options.currentSettings));
    }

    if (options.shouldRestorePreviousNotes) {
      rollbackOperations.push(() => this.noteService.replaceNotes(options.currentNotes, options.password));
    }

    for (const rollback of rollbackOperations) {
      try {
        await rollback();
      } catch (rollbackError) {
        console.error("Failed to roll back an interrupted restore:", rollbackError);
      }
    }
  }

}
