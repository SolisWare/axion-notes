/**
 * Copyright (c) 2024-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from '../../src/models/NoteType';
import { SystemTheme } from '../../src/theme/SystemTheme';
import { AppSettings } from '../../src/settings/AppSettings';
import { MenuEditSelectionState } from '../../src/models/MenuEditSelectionState';
import { NoteLayoutPreference } from '../../src/settings/NoteLayoutPreference';
import { NotesChangeEvent } from '../../src/models/NotesChangeEvent';
import { OpenNoteWindowOptions } from '../../src/models/OpenNoteWindowOptions';
import { RichTextFormatCommand } from '../../src/models/RichTextFormatCommand';
import { RichTextFormatState } from '../../src/models/RichTextFormatState';

interface IElectronAPI {
  appWindow: {
    close: () => void;
    readyToShow: () => void;
    setAlwaysOnTop: (enabled: boolean) => void;
    setLayout: (layout: NoteLayoutPreference) => void;
  },
  storage: {
    getNotes: () => Promise<NoteType[]>;
    getNotesFolderLocation: () => Promise<string>;
    setNote: (note: NoteType) => void;
    setNoteOrder: (noteIds: string[]) => void;
    deleteNote: (noteId: string) => void;
    deleteAllNotes: () => void;
    onNotesChange: (callback: (event: NotesChangeEvent) => void) => () => void;
  },
  menu: {
    onMenuNewNote: (callback: () => void) => () => void;
    onMenuShowWelcome: (callback: () => void) => () => void;
    onMenuDeleteAllNotes: (callback: () => void) => () => void;
    onMenuRichTextFormat: (callback: (command: RichTextFormatCommand) => void) => () => void;
    setDeleteAllNotesEnabled: (enabled: boolean) => void;
    setEditSelectionState: (state: MenuEditSelectionState) => void;
    setRichTextFormatState: (state: RichTextFormatState) => void;
    setNewNoteEnabled: (enabled: boolean) => void;
  },
  noteSort: {
    requestSort: () => void;
    onSortRequest: (callback: () => void) => () => void;
  },
  noteWindow: {
    open: (noteId: string, options?: OpenNoteWindowOptions) => void;
  },
  settings: {
    getSettings: () => Promise<AppSettings | undefined>;
    getSettingsFolderLocation: () => Promise<string>;
    setSettings: (settings: AppSettings) => void;
    onSettingsChange: (callback: (settings: AppSettings) => void) => () => void;
  },
  version: {
    getShortDisplayVersion: () => string;
  },
  systemTheme: {
    onThemeChange: (callback: (theme: SystemTheme) => void) => () => void;
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
