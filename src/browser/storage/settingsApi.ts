/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppSettings } from "../../settings/AppSettings";
import { getSettings, setSettings } from "./appSettingsStorage";

export const settingsApi = {

  getSettings: async (): Promise<AppSettings | undefined> => {
    try {
      return await getSettings();
    } catch (err) {
      console.error("Failed to load browser app settings:", err);
      return undefined;
    }
  },

  setSettings: (settings: AppSettings) => {
    try {
      setSettings(settings);
    } catch (err) {
      console.error("Failed to save browser app settings:", err);
    }
  }
};
