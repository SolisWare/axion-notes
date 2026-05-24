/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppSettings } from "../../settings/AppSettings";

const appSettingsKey = "x-notes.app-settings";

export function getSettings(): Promise<AppSettings | undefined> {
  const serializedSettings = localStorage.getItem(appSettingsKey);

  if (!serializedSettings) {
    return Promise.resolve(undefined);
  }

  try {
    return Promise.resolve(JSON.parse(serializedSettings) as AppSettings);
  } catch (err) {
    console.warn("Failed to load browser app settings:", err);
    return Promise.resolve(undefined);
  }
}

export function setSettings(settings: AppSettings): void {
  localStorage.setItem(appSettingsKey, JSON.stringify(settings));
}
