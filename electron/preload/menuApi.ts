/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { channels } from "../ipc/channels";
import { off, on, send } from "./ipcHelpers";

export const menuApi = {

  onMenuNewNote: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.newNote, listener);
    return () => off(channels.menu.newNote, listener);
  },

  onMenuShowWelcome: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.showWelcome, listener);
    return () => off(channels.menu.showWelcome, listener);
  },

  onMenuDeleteAllNotes: (callback: () => void) => {
    const listener = () => callback();
    on(channels.menu.deleteAllNotes, listener);
    return () => off(channels.menu.deleteAllNotes, listener);
  },
  
  setDeleteAllNotesEnabled: (enabled: boolean) => {
    send(channels.menu.setDeleteAllNotesEnabled, enabled);
  }
};
