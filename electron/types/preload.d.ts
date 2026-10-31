/**
 * Copyright (c) 2024-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from '../../src/types/NoteType';
import { SystemTheme } from '../../src/theme/SystemTheme';
import { AppSettings } from '../../src/settings/AppSettings';
import { MenuEditSelectionState } from '../../src/types/MenuEditSelectionState';
import { MenuNoteSelectionState } from '../../src/types/MenuNoteSelectionState';
import { NoteLayoutPreference } from '../../src/settings/NoteLayoutPreference';
import { NotesChangeEvent } from '../../src/types/NotesChangeEvent';
import { NotesWithAccessState } from '../../src/types/NotesWithAccessState';
import { OpenNoteWindowOptions } from '../../src/types/OpenNoteWindowOptions';
import { RichTextFormatAction } from '../../src/types/RichTextFormatCommand';
import { RichTextFormatState } from '../../src/types/RichTextFormatState';
import { LockState } from '../../src/types/LockState';
import { UnlockResult } from '../../src/types/UnlockResult';
import { EncryptionProgressEvent } from '../../src/types/EncryptionProgressEvent';

export interface IElectronAPI {
  appWindow: {
    close: () => void;
    readyToShow: () => void;
    restart: () => void;
    setAlwaysOnTop: (enabled: boolean) => void;
    setLayout: (layout: NoteLayoutPreference) => void;
  },
  storage: {
    getNotes: () => Promise<NoteType[]>;
    getNotesWithAccessState: () => Promise<NotesWithAccessState>;
    getNotesFolderLocation: () => Promise<string>;
    setNote: (note: NoteType) => void;
    setNoteOrder: (noteIds: string[]) => void;
    deleteNote: (noteId: string) => void;
    deleteAllNotes: () => void;
    onNotesChange: (callback: (event: NotesChangeEvent) => void) => () => void;
  },
  menu: {
    onMenuNewNote: (callback: () => void) => () => void;
    onMenuSetNoteLayout: (callback: (layout: NoteLayoutPreference) => void) => () => void;
    onMenuSetNoteSortOrder: (callback: (sortOrder: NoteSortOrder) => void) => () => void;
    onMenuResortNotes: (callback: () => void) => () => void;
    onMenuShowWelcome: (callback: () => void) => () => void;
    onMenuSelectNote: (callback: () => void) => () => void;
    onMenuSelectAllNotes: (callback: () => void) => () => void;
    onMenuCancelNoteSelection: (callback: () => void) => () => void;
    onMenuDeleteAllNotes: (callback: () => void) => () => void;
    onMenuRichTextFormat: (callback: (command: RichTextFormatAction) => void) => () => void;
    setDeleteAllNotesEnabled: (enabled: boolean) => void;
    setEditSelectionState: (state: MenuEditSelectionState) => void;
    setNoteSelectionState: (state: MenuNoteSelectionState) => void;
    setRichTextFormatState: (state: RichTextFormatState) => void;
    setNewNoteEnabled: (enabled: boolean) => void;
  },
  noteSort: {
    requestSort: () => void;
    onSortRequest: (callback: () => void) => () => void;
    onSortApplied: (callback: () => void) => () => void;
  },
  noteWindow: {
    open: (noteId: string, options?: OpenNoteWindowOptions) => void;
    onClosed: (callback: (noteId: string) => void) => () => void;
  },
  security: {
    changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
    clearPassword: () => Promise<boolean>;
    disableEncryption: (password: string) => Promise<boolean>;
    enableEncryption: (password: string) => Promise<boolean>;
    getLockState: () => Promise<LockState>;
    getSecurityFolderLocation: () => Promise<string>;
    hasPassword: () => Promise<boolean>;
    lock: () => Promise<boolean>;
    onEncryptionProgress: (callback: (progress: EncryptionProgressEvent) => void) => () => void;
    onLockStateChange: (callback: (lockState: LockState) => void) => () => void;
    onSecureLockComplete: (callback: () => void) => () => void;
    setPassword: (password: string) => Promise<boolean>;
    unlock: (password: string) => Promise<UnlockResult>;
    verifyPassword: (password: string) => Promise<boolean>;
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
