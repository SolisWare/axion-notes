/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BackupState } from "../../src/types/BackupState";
import { channels } from "../ipc/channels";
import { receive } from "./ipcHelpers";

export const backupApi = {
  getState: async (): Promise<BackupState | undefined> => {
    return receive<BackupState | undefined>(channels.backup.getState);
  },

  initialize: async (): Promise<BackupState | undefined> => {
    return receive<BackupState | undefined>(channels.backup.initialize);
  }
};
