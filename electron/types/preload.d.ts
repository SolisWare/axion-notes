/**
 * Copyright (c) 2024-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from '../../src/models/NoteType';
import { SystemTheme } from '../../src/theme/SystemTheme';
import { AppSettings } from '../../src/settings/AppSettings';

interface IElectronAPI {
  storage: {
    getDataDir: () => Promise<string>;
    getNotes: () => Promise<NoteType[]>;
    setNote: (note: NoteType) => void;
    deleteNote: (noteId: string) => void;
    deleteAllNotes: () => void;
  },
  menu: {
    onMenuNewNote: (callback: () => void) => void;
  },
  settings: {
    getSettings: () => Promise<AppSettings | undefined>;
  },
  version: {
    getShortDisplayVersion: () => string;
  },
  systemTheme: {
    onThemeChange: (callback: (theme: SystemTheme) => void) => void;
  },
  os: {
    isMac: boolean;
    isWindows: boolean;
  }
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
