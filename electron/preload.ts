/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { contextBridge, ipcRenderer } from "electron";
import { NoteType } from "../src/models/NoteType";
import { isMac, isWindows } from './utils/Platform';
import appVersionConfig from "../app-version-config.json";
import { AppVersionResolver } from "../scripts/app-version/AppVersionResolver";
import { SystemTheme } from "../src/theme/SystemTheme";
import { AppSettings } from "../src/settings/AppSettings";

// All Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const send = (channel: string, ...data: any[]): void => {
  ipcRenderer.send(channel, data);
};

const receive = async (channel: string): Promise<any> => {
  return ipcRenderer.invoke(channel);
};

const on = (channel: string, callback: (...args: any[]) => void): void => {
  ipcRenderer.on(channel, callback);
};

const off = (channel: string, callback: (...args: any[]) => void): void => {
  ipcRenderer.removeListener(channel, callback);
};

contextBridge.exposeInMainWorld('api', {
  storage: {
    setNote: (note: NoteType) => {
      send('storage.setNote', note);
    },
    getNotes: () => {
      return receive('storage.getNotes')
        .then((notes: NoteType[]) => {
          console.log(`Loaded ${notes.length} notes`);
          return notes;
        })
        .catch((err: Error): NoteType[] => {
          console.error('Failed to load notes:', err.message);
          return [] as NoteType[];
        });
    },
    deleteNote: (noteId: string) => {
      send('storage.deleteNote', noteId);
    },
    deleteAllNotes: () => {
      send('storage.deleteAllNotes');
    }
  },
  menu: {
    onMenuNewNote: (callback: () => void) => {
      on('menu.newNote', callback);
    },
    onMenuDeleteAllNotes: (callback: () => void) => {
      on('menu.deleteAllNotes', callback);
    },
    setDeleteAllNotesEnabled: (enabled: boolean) => {
      send('menu.setDeleteAllNotesEnabled', enabled);
    }
  },
  settings: {
    getSettings: (): Promise<AppSettings | undefined> => {
      return receive('settings.getSettings')
        .catch((err: Error): AppSettings | undefined => {
          console.error('Failed to load app settings:', err.message);
          return undefined;
        });
    },
    setSettings: (settings: AppSettings) => {
      send('settings.setSettings', settings);
    }
  },
  version: {
    getShortDisplayVersion: () => {
      return AppVersionResolver.getShortDisplayVersion(appVersionConfig);
    }
  },
  systemTheme: {
    onThemeChange: (callback: (theme: SystemTheme) => void) => {
      receive("systemTheme.onThemeChange")
        .then(callback)
        .catch((error: Error) => {
          console.error("Failed to load system theme:", error.message);
        });

      const listener = (_event: Electron.IpcRendererEvent, theme: SystemTheme) => {
        callback(theme);
      };

      on("systemTheme.onThemeChange", listener);

      return () => {
        off("systemTheme.onThemeChange", listener);
      };
    }
  },
  os: {
    isMac,
    isWindows
  }
});

// THIS is just to satify TypeScript error
export {}
