/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { defaultAppSettings } from "../settings/defaultSettings";
import { resolveSystemTheme, SystemTheme } from "../theme/SystemTheme";
import { AppVersionConfig } from "../utils/app-version/AppVersionConfig";
import { AppVersionResolver } from "../utils/app-version/AppVersionResolver";
import { UserAgent } from "../utils/UserAgent";

const noop = () => {};
const unsubscribe = () => {};

function getBrowserSystemTheme(): SystemTheme {
  return resolveSystemTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function getBrowserVersionLabel(): string {
  const appVersionConfig = process.env.REACT_APP_APP_VERSION_CONFIG;

  if (!appVersionConfig) {
    return "Web";
  }

  return `Web ${AppVersionResolver.getShortDisplayVersion(JSON.parse(appVersionConfig) as AppVersionConfig)}`;
}

export function installBrowserApi(): void {
  if (window.api) {
    return;
  }

  window.api = {
    storage: {
      getNotes: async () => [],
      setNote: noop,
      deleteNote: noop,
      deleteAllNotes: noop
    },
    menu: {
      onMenuNewNote: () => unsubscribe,
      onMenuShowWelcome: () => unsubscribe,
      onMenuDeleteAllNotes: () => unsubscribe,
      setDeleteAllNotesEnabled: noop,
      setNewNoteEnabled: noop
    },
    settings: {
      getSettings: async () => defaultAppSettings,
      setSettings: noop
    },
    version: {
      getShortDisplayVersion: getBrowserVersionLabel
    },
    systemTheme: {
      onThemeChange: (callback) => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const listener = (event: MediaQueryListEvent) => {
          callback(resolveSystemTheme(event.matches));
        };

        callback(getBrowserSystemTheme());
        mediaQuery.addEventListener("change", listener);

        return () => {
          mediaQuery.removeEventListener("change", listener);
        };
      }
    },
    os: {
      isMac: UserAgent.isMac,
      isWindows: UserAgent.isWindows
    }
  };
}
