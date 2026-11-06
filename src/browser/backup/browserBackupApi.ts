/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BackupArchiveContent } from "../../backup/backupArchive";
import { getDefaultBackupFileName } from "../../backup/backupFileName";
import { defaultBackupContentSelection } from "../../settings/defaultBackupContentSelection";
import { BackupContentSelection } from "../../types/BackupContentSelection";
import { BackupCreateResult, BackupCreateStatus } from "../../types/BackupCreateResult";
import { BackupDeleteResult, BackupDeleteStatus } from "../../types/BackupDeleteResult";
import { BackupSaveResult, BackupSaveStatus } from "../../types/BackupSaveResult";
import { BackupState } from "../../types/BackupState";
import { getSettings } from "../storage/appSettingsStorage";
import { getNotes } from "../storage/noteStorage";
import { getBackupState, setBackupState } from "../storage/backupStateStorage";
import { createBrowserBackupArchive } from "./browserBackupArchive";
import { downloadBrowserBackupArchive } from "./browserBackupDownload";

type BrowserBackupApiOptions = {
  createArchive?: (content: BackupArchiveContent) => Promise<Uint8Array>;
  downloadArchive?: (archive: Uint8Array, fileName: string) => void;
  getCurrentDate?: () => Date;
};

/**
 * Creates browser backup operations backed by Axion Notes local storage.
 */
export function createBrowserBackupApi(options: BrowserBackupApiOptions = {}) {
  const createArchive = options.createArchive ?? createBrowserBackupArchive;
  const downloadArchive = options.downloadArchive ?? downloadBrowserBackupArchive;
  const getCurrentDate = options.getCurrentDate ?? (() => new Date());

  return {
    createArchive: async (): Promise<BackupCreateResult> => {
      const state = getBackupState();

      if (!state) {
        return { status: BackupCreateStatus.FAILED };
      }

      const createdAt = getCurrentDate().toISOString();
      const contentSelection = normalizeBrowserContentSelection(state.contentSelection);

      try {
        const [notes, settings] = await Promise.all([
          getNotes(),
          contentSelection.appSettings ? getSettings() : Promise.resolve(undefined)
        ]);
        const archive = await createArchive({
          appSettings: settings,
          contentSelection,
          createdAt,
          notes
        });

        downloadArchive(archive, getDefaultBackupFileName(getCurrentDate(), settings?.dateFormat, settings?.timeFormat));

        const updatedState: BackupState = {
          ...state,
          contentSelection,
          lastBackupCreatedAt: createdAt
        };
        setBackupState(updatedState);

        return {
          status: BackupCreateStatus.CREATED,
          state: updatedState
        };
      } catch (err) {
        console.warn("Failed to create browser backup:", err);
        return { status: BackupCreateStatus.FAILED };
      }
    },

    deleteArchive: async (): Promise<BackupDeleteResult> => ({ status: BackupDeleteStatus.FAILED }),

    getState: async (): Promise<BackupState | undefined> => {
      const state = getBackupState();

      return state && {
        ...state,
        contentSelection: normalizeBrowserContentSelection(state.contentSelection)
      };
    },

    initialize: async (): Promise<BackupState | undefined> => {
      const existingState = getBackupState();

      if (existingState) {
        return {
          ...existingState,
          contentSelection: normalizeBrowserContentSelection(existingState.contentSelection)
        };
      }

      try {
        const state: BackupState = {
          version: 1,
          initializedAt: getCurrentDate().toISOString(),
          contentSelection: normalizeBrowserContentSelection(defaultBackupContentSelection)
        };
        setBackupState(state);
        return state;
      } catch (err) {
        console.warn("Failed to initialize browser backups:", err);
        return undefined;
      }
    },

    saveCopy: async (): Promise<BackupSaveResult> => ({ status: BackupSaveStatus.FAILED }),

    updateContentSelection: async (contentSelection: BackupContentSelection): Promise<BackupState | undefined> => {
      const state = getBackupState();

      if (!state) {
        return undefined;
      }

      try {
        const updatedState: BackupState = {
          ...state,
          contentSelection: normalizeBrowserContentSelection(contentSelection)
        };
        setBackupState(updatedState);
        return updatedState;
      } catch (err) {
        console.warn("Failed to update browser backup options:", err);
        return undefined;
      }
    }
  };
}

export const browserBackupApi = createBrowserBackupApi();

function normalizeBrowserContentSelection(contentSelection: BackupContentSelection): BackupContentSelection {
  return {
    ...contentSelection,
    mainWindowState: false
  };
}
