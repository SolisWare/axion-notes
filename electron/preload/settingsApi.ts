/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppSettings } from "../../src/settings/AppSettings";
import { channels } from "../ipc/channels";
import { off, on, receive, send } from "./ipcHelpers";

export const settingsApi = {

  getSettings: async (): Promise<AppSettings | undefined> => {
    try {
      return await receive<AppSettings | undefined>(channels.settings.getSettings);
    } catch (err) {
      console.error('Failed to load app settings:', (err as Error).message);
      return undefined;
    }
  },
  
  setSettings: (settings: AppSettings) => {
    send(channels.settings.setSettings, settings);
  },

  onSettingsChange: (callback: (settings: AppSettings) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, settings: AppSettings) => {
      callback(settings);
    };

    on(channels.settings.onSettingsChange, listener);

    return () => {
      off(channels.settings.onSettingsChange, listener);
    };
  }
};
