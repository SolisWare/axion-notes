/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { createRestorePlan } from "../../backup/restorePlan";
import { prepareRestoredNotes } from "../../backup/restoreNotes";
import { prepareRestoredSettings } from "../../backup/restoreSettings";
import { ValidatedBackupArchive } from "../../backup/restoreArchive";
import { defaultAppSettings } from "../../settings/defaultSettings";
import { AppSettings } from "../../settings/AppSettings";
import { NoteType } from "../../types/NoteType";
import { RestoreApplyOptions } from "../../types/RestoreApplyOptions";
import { RestoreApplyResult, RestoreApplyStatus } from "../../types/RestoreApplyResult";
import { RestoreChooseResult, RestoreChooseStatus } from "../../types/RestoreChooseResult";
import { RestoreInspectResult, RestoreInspectStatus } from "../../types/RestoreInspectResult";
import { RestoreSettingsMode } from "../../types/RestoreSettingsMode";
import { RestoreState } from "../../types/RestoreState";
import { getSettings, setSettings } from "../storage/appSettingsStorage";
import { getNotes } from "../storage/noteStorage";
import { clearRestoreState, getRestoreState, setRestoreState } from "../storage/restoreStateStorage";
import { replaceBrowserNotes } from "../storage/storageApi";
import { chooseBrowserRestoreArchive } from "./browserRestoreFilePicker";
import { readBrowserRestoreArchive } from "./browserRestoreArchive";

const browserArchiveReference = "browser-selected-backup";

type BrowserRestoreApiOptions = {
  chooseArchive?: () => Promise<Uint8Array | undefined>;
  createNoteId?: () => string;
  getCurrentDate?: () => Date;
  getNotes?: () => Promise<NoteType[]>;
  getRestoreState?: () => RestoreState | undefined;
  getSettings?: () => Promise<AppSettings | undefined>;
  readArchive?: (bytes: Uint8Array) => ValidatedBackupArchive;
  replaceNotes?: (notes: NoteType[]) => void;
  setRestoreState?: (state: RestoreState | undefined) => void;
  setSettings?: (settings: AppSettings) => void;
};

export function createBrowserRestoreApi(options: BrowserRestoreApiOptions = {}) {
  const chooseArchive = options.chooseArchive ?? chooseBrowserRestoreArchive;
  const createNoteId = options.createNoteId ?? (() => crypto.randomUUID());
  const getCurrentDate = options.getCurrentDate ?? (() => new Date());
  const loadNotes = options.getNotes ?? getNotes;
  const loadRestoreState = options.getRestoreState ?? getRestoreState;
  const loadSettings = options.getSettings ?? getSettings;
  const readArchive = options.readArchive ?? readBrowserRestoreArchive;
  const replaceNotes = options.replaceNotes ?? replaceBrowserNotes;
  const saveRestoreState = options.setRestoreState ?? ((state: RestoreState | undefined) => {
    if (state) {
      setRestoreState(state);
      return;
    }

    clearRestoreState();
  });
  const saveSettings = options.setSettings ?? setSettings;
  let selectedArchiveBytes: Uint8Array | undefined;

  return {
    apply: async (archiveReference: string, restoreOptions: RestoreApplyOptions): Promise<RestoreApplyResult> => {
      let archive: ValidatedBackupArchive;

      try {
        archive = getSelectedArchive(archiveReference, selectedArchiveBytes, readArchive);
      } catch (err) {
        console.warn("Failed to read browser backup archive:", err);
        return { status: RestoreApplyStatus.INVALID_ARCHIVE };
      }

      try {
        const [currentNotes, loadedSettings] = await Promise.all([loadNotes(), loadSettings()]);
        const currentRestoreState = loadRestoreState();
        const currentSettings = loadedSettings ?? defaultAppSettings;
        const shouldRestoreSettings = restoreOptions.settingsMode === RestoreSettingsMode.RESTORE_BACKUP;
        const restoredNotes = prepareRestoredNotes(archive, currentNotes, restoreOptions.notesMode, createNoteId).notes;
        const restoredSettings = prepareRestoredSettings(currentSettings, archive.appSettings, restoreOptions.settingsMode);
        const state: RestoreState = { lastRestoredAt: getCurrentDate().toISOString(), version: 1 };
        let shouldRestorePreviousNotes = false;
        let shouldRestorePreviousSettings = false;
        let shouldRestorePreviousRestoreState = false;

        try {
          shouldRestorePreviousNotes = true;
          replaceNotes(restoredNotes);

          if (shouldRestoreSettings) {
            shouldRestorePreviousSettings = true;
            saveSettings(restoredSettings);
          }

          shouldRestorePreviousRestoreState = true;
          saveRestoreState(state);
        } catch (err) {
          restorePreviousBrowserState({
            currentNotes,
            currentRestoreState,
            currentSettings,
            restoreNotes: replaceNotes,
            restoreSettings: saveSettings,
            restoreState: saveRestoreState,
            shouldRestorePreviousNotes,
            shouldRestorePreviousRestoreState,
            shouldRestorePreviousSettings
          });
          throw err;
        }

        return { state, status: RestoreApplyStatus.APPLIED };
      } catch (err) {
        console.warn("Failed to restore browser backup:", err);
        return { status: RestoreApplyStatus.FAILED };
      }
    },

    chooseArchive: async (): Promise<RestoreChooseResult> => {
      try {
        selectedArchiveBytes = await chooseArchive();
        return selectedArchiveBytes
          ? { filePath: browserArchiveReference, status: RestoreChooseStatus.SELECTED }
          : { status: RestoreChooseStatus.CANCELLED };
      } catch (err) {
        console.warn("Failed to choose browser backup archive:", err);
        return { status: RestoreChooseStatus.FAILED };
      }
    },

    getState: async (): Promise<RestoreState | undefined> => loadRestoreState(),

    inspect: async (archiveReference: string): Promise<RestoreInspectResult> => {
      try {
        const archive = getSelectedArchive(archiveReference, selectedArchiveBytes, readArchive);
        const [currentNotes, settings] = await Promise.all([loadNotes(), loadSettings()]);

        return {
          plan: createRestorePlan(archive, {
            currentNotes,
            isNotesEncryptionEnabled: Boolean(settings?.notesEncryptionEnabled)
          }),
          status: RestoreInspectStatus.READY
        };
      } catch (err) {
        console.warn("Failed to inspect browser backup archive:", err);
        return { status: RestoreInspectStatus.INVALID_ARCHIVE };
      }
    }
  };
}

function restorePreviousBrowserState(options: {
  currentNotes: NoteType[];
  currentRestoreState: RestoreState | undefined;
  currentSettings: AppSettings;
  restoreNotes: (notes: NoteType[]) => void;
  restoreSettings: (settings: AppSettings) => void;
  restoreState: (state: RestoreState | undefined) => void;
  shouldRestorePreviousNotes: boolean;
  shouldRestorePreviousRestoreState: boolean;
  shouldRestorePreviousSettings: boolean;
}): void {
  const rollbackOperations: Array<() => void> = [];

  if (options.shouldRestorePreviousRestoreState) {
    rollbackOperations.push(() => options.restoreState(options.currentRestoreState));
  }

  if (options.shouldRestorePreviousSettings) {
    rollbackOperations.push(() => options.restoreSettings(options.currentSettings));
  }

  if (options.shouldRestorePreviousNotes) {
    rollbackOperations.push(() => options.restoreNotes(options.currentNotes));
  }

  rollbackOperations.forEach((rollback) => {
    try {
      rollback();
    } catch (rollbackError) {
      console.error("Failed to roll back an interrupted browser restore:", rollbackError);
    }
  });
}

export const browserRestoreApi = createBrowserRestoreApi();

function getSelectedArchive(
  archiveReference: string,
  selectedArchiveBytes: Uint8Array | undefined,
  readArchive: (bytes: Uint8Array) => ValidatedBackupArchive
): ValidatedBackupArchive {
  if (archiveReference !== browserArchiveReference || !selectedArchiveBytes) {
    throw new Error("No browser backup archive has been selected.");
  }

  return readArchive(selectedArchiveBytes);
}
