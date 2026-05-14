/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app, Menu } from "electron";
import { isMac, isWindows } from "./utils/Platform";
import { BrowserWindow } from "electron";

const template: any = [
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      // { label: 'Preferences' },
      // { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ]
  }] : []),
  {
    label: 'File',
    submenu: [
      ...(isWindows ? [
        { role: 'about' as const },
        { type: 'separator' as const }
      ] : []),
      { 
        label: 'New Note...',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          BrowserWindow.getFocusedWindow()?.webContents.send('menu.newNote');
        }
      },
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
      { role: 'delete' },
      { type: 'separator' },
      {
        label: 'Delete All Notes...',
        click: () => {
          BrowserWindow.getFocusedWindow()?.webContents.send('menu.deleteAllNotes');
        }
      }
    ]
  }
];

const menubar = Menu.buildFromTemplate(template);

export default menubar;
