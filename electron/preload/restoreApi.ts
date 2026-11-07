/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { RestoreApplyOptions } from "../storage/RestoreService";
import { RestoreApplyResult } from "../../src/types/RestoreApplyResult";
import { RestoreChooseResult } from "../../src/types/RestoreChooseResult";
import { RestoreInspectResult } from "../../src/types/RestoreInspectResult";
import { channels } from "../ipc/channels";
import { receive } from "./ipcHelpers";

export const restoreApi = {
  apply: async (archivePath: string, options: RestoreApplyOptions): Promise<RestoreApplyResult> => {
    return receive<RestoreApplyResult>(channels.restore.apply, archivePath, options);
  },

  chooseArchive: async (): Promise<RestoreChooseResult> => {
    return receive<RestoreChooseResult>(channels.restore.chooseArchive);
  },

  inspect: async (archivePath: string, password?: string): Promise<RestoreInspectResult> => {
    return receive<RestoreInspectResult>(channels.restore.inspect, archivePath, password);
  }
};
