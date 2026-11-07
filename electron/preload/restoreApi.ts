/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { RestoreApplyOptions } from "../../src/types/RestoreApplyOptions";
import { RestoreApplyResult } from "../../src/types/RestoreApplyResult";
import { RestoreChooseResult } from "../../src/types/RestoreChooseResult";
import { RestoreInspectResult } from "../../src/types/RestoreInspectResult";
import { RestoreState } from "../../src/types/RestoreState";
import { RestoreProgressEvent } from "../../src/types/RestoreProgressEvent";
import { channels } from "../ipc/channels";
import { off, on, receive } from "./ipcHelpers";

export const restoreApi = {
  apply: async (archivePath: string, options: RestoreApplyOptions): Promise<RestoreApplyResult> => {
    return receive<RestoreApplyResult>(channels.restore.apply, archivePath, options);
  },

  chooseArchive: async (): Promise<RestoreChooseResult> => {
    return receive<RestoreChooseResult>(channels.restore.chooseArchive);
  },

  getState: async (): Promise<RestoreState | undefined> => {
    return receive<RestoreState | undefined>(channels.restore.getState);
  },

  inspect: async (archivePath: string, password?: string): Promise<RestoreInspectResult> => {
    return receive<RestoreInspectResult>(channels.restore.inspect, archivePath, password);
  },

  onProgress: (callback: (progress: RestoreProgressEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: RestoreProgressEvent): void => callback(progress);
    on<[RestoreProgressEvent]>(channels.restore.onProgress, listener);

    return () => off<[RestoreProgressEvent]>(channels.restore.onProgress, listener);
  }
};
