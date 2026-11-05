/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BackupState } from "../../src/types/BackupState";
import { BackupContentSelection } from "../../src/types/BackupContentSelection";
import { BackupCreateResult } from "../../src/types/BackupCreateResult";
import { BackupSaveResult } from "../../src/types/BackupSaveResult";
import { channels } from "../ipc/channels";
import { receive } from "./ipcHelpers";

export const backupApi = {
  createArchive: async (password?: string): Promise<BackupCreateResult> => {
    return receive<BackupCreateResult>(channels.backup.createArchive, password);
  },

  getState: async (): Promise<BackupState | undefined> => {
    return receive<BackupState | undefined>(channels.backup.getState);
  },

  initialize: async (): Promise<BackupState | undefined> => {
    return receive<BackupState | undefined>(channels.backup.initialize);
  },

  saveCopy: async (): Promise<BackupSaveResult> => {
    return receive<BackupSaveResult>(channels.backup.saveCopy);
  },

  updateContentSelection: async (contentSelection: BackupContentSelection): Promise<BackupState | undefined> => {
    return receive<BackupState | undefined>(channels.backup.updateContentSelection, contentSelection);
  }
};
