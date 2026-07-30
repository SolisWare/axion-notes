/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { resolveSystemTheme, SystemTheme } from "../theme/SystemTheme";
import i18n from "../i18n/i18n";
import { AppVersionConfig } from "../utils/app-version/AppVersionConfig";
import { AppVersionResolver } from "../utils/app-version/AppVersionResolver";
import { type UnlockResult } from "../models/UnlockResult";
import { UserAgent } from "../utils/UserAgent";
import { settingsApi } from "./storage/settingsApi";
import { storageApi } from "./storage/storageApi";

const noop = () => {};
const unsubscribe = () => {};
const noteSortRequestEventName = "axion-notes:note-sort-request";

function getBrowserSystemTheme(): SystemTheme {
  return resolveSystemTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function getBrowserVersionLabel(): string {
  const appVersionConfig = process.env.REACT_APP_APP_VERSION_CONFIG;
  const webLabel = i18n.t("settingsWindow.about.webVersionLabel");

  if (!appVersionConfig) {
    return webLabel;
  }

  return `${webLabel} ${AppVersionResolver.getShortDisplayVersion(JSON.parse(appVersionConfig) as AppVersionConfig)}`;
}

export function installBrowserApi(): void {
  if (window.api) {
    return;
  }

  window.api = {
    appWindow: {
      close: noop,
      readyToShow: noop,
      setAlwaysOnTop: noop,
      setLayout: noop
    },
    storage: storageApi,
    menu: {
      onMenuNewNote: () => unsubscribe,
      onMenuShowWelcome: () => unsubscribe,
      onMenuSelectNote: () => unsubscribe,
      onMenuSelectAllNotes: () => unsubscribe,
      onMenuCancelNoteSelection: () => unsubscribe,
      onMenuDeleteAllNotes: () => unsubscribe,
      onMenuRichTextFormat: () => unsubscribe,
      setDeleteAllNotesEnabled: noop,
      setEditSelectionState: noop,
      setNoteSelectionState: noop,
      setRichTextFormatState: noop,
      setNewNoteEnabled: noop
    },
    noteSort: {
      requestSort: () => {
        window.dispatchEvent(new Event(noteSortRequestEventName));
      },
      onSortRequest: (callback) => {
        const listener = () => callback();
        window.addEventListener(noteSortRequestEventName, listener);

        return () => {
          window.removeEventListener(noteSortRequestEventName, listener);
        };
      }
    },
    noteWindow: {
      open: noop,
      onClosed: () => unsubscribe
    },
    security: {
      changePassword: async () => false,
      clearPassword: async () => false,
      disableEncryption: async () => false,
      enableEncryption: async () => false,
      getLockState: async () => ({
        isLocked: false,
        isRecoveryRequired: false
      }),
      hasPassword: async () => false,
      lock: async () => false,
      onEncryptionProgress: () => unsubscribe,
      onLockStateChange: () => unsubscribe,
      onSecureLockComplete: () => unsubscribe,
      setPassword: async () => false,
      unlock: async (): Promise<UnlockResult> => ({ status: "invalidPassword" as UnlockResult["status"] }),
      verifyPassword: async () => false
    },
    settings: settingsApi,
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
