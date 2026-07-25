/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { channels } from "../ipc/channels";
import { off, on, send } from "./ipcHelpers";
import { MenuEditSelectionState } from "../../src/models/MenuEditSelectionState";
import { MenuNoteSelectionState } from "../../src/models/MenuNoteSelectionState";
import { RichTextFormatAction } from "../../src/models/RichTextFormatCommand";
import { RichTextFormatState } from "../../src/models/RichTextFormatState";

export const menuApi = {

  onMenuNewNote: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.newNote, listener);
    return () => off(channels.menu.newNote, listener);
  },

  onMenuLockNotes: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.lockNotes, listener);
    return () => off(channels.menu.lockNotes, listener);
  },

  onMenuShowWelcome: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.showWelcome, listener);
    return () => off(channels.menu.showWelcome, listener);
  },

  onMenuSelectNote: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.selectNote, listener);
    return () => off(channels.menu.selectNote, listener);
  },

  onMenuSelectAllNotes: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.selectAllNotes, listener);
    return () => off(channels.menu.selectAllNotes, listener);
  },

  onMenuCancelNoteSelection: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.cancelNoteSelection, listener);
    return () => off(channels.menu.cancelNoteSelection, listener);
  },

  onMenuDeleteAllNotes: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.deleteAllNotes, listener);
    return () => off(channels.menu.deleteAllNotes, listener);
  },

  onMenuRichTextFormat: (callback: (command: RichTextFormatAction) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, command: RichTextFormatAction) => callback(command);
    on(channels.menu.formatRichText, listener);
    return () => off(channels.menu.formatRichText, listener);
  },
  
  setDeleteAllNotesEnabled: (enabled: boolean) => {
    send(channels.menu.setDeleteAllNotesEnabled, enabled);
  },

  setEditSelectionState: (state: MenuEditSelectionState) => {
    send(channels.menu.setEditSelectionState, state);
  },

  setLockScreenActive: (active: boolean) => {
    send(channels.menu.setLockScreenActive, active);
  },

  setNoteSelectionState: (state: MenuNoteSelectionState) => {
    send(channels.menu.setNoteSelectionState, state);
  },

  setRichTextFormatState: (state: RichTextFormatState) => {
    send(channels.menu.setRichTextFormatState, state);
  },

  setNewNoteEnabled: (enabled: boolean) => {
    send(channels.menu.setNewNoteEnabled, enabled);
  }
};
