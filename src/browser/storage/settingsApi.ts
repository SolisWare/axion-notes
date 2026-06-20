/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppSettings } from "../../settings/AppSettings";
import i18n from "../../i18n/i18n";
import { appSettingsKey, getSettings, setSettings } from "./appSettingsStorage";

export const settingsApi = {

  getSettings: async (): Promise<AppSettings | undefined> => {
    try {
      return await getSettings();
    } catch (err) {
      console.error("Failed to load browser app settings:", err);
      return undefined;
    }
  },

  getSettingsFolderLocation: async (): Promise<string> => {
    return i18n.t("settingsWindow.dataStorage.browserLocalStorage");
  },

  setSettings: (settings: AppSettings) => {
    try {
      setSettings(settings);
    } catch (err) {
      console.error("Failed to save browser app settings:", err);
    }
  },

  onSettingsChange: (callback: (settings: AppSettings) => void) => {
    const listener = (event: StorageEvent) => {
      if (event.key !== appSettingsKey || !event.newValue) {
        return;
      }

      callback(JSON.parse(event.newValue) as AppSettings);
    };

    window.addEventListener("storage", listener);

    return () => {
      window.removeEventListener("storage", listener);
    };
  }
};
