/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app, BrowserWindow, Menu, shell } from "electron";
import { isMac, isWindows } from "./utils/Platform";
import { channels } from "./ipc/channels";
import { menuIds } from "./ipc/menuIds";
import { createLicenseWindow } from "./windows/createLicenseWindow";
import { createSettingsWindow } from "./windows/createSettingsWindow";

const template: any = [
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      {
        id: menuIds.app.settings,
        label: 'Settings...',
        accelerator: 'Cmd+,',
        click: () => {
          createSettingsWindow();
        }
      },
      { type: 'separator' },
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
        id: menuIds.file.newNote,
        label: 'New Note...',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.newNote);
        }
      },
      { type: 'separator' },
      ...(isWindows ? [
        {
          id: menuIds.file.settings,
          label: 'Settings...',
          accelerator: 'Ctrl+,',
          click: () => {
            createSettingsWindow();
          }
        },
        { type: 'separator' as const }
      ] : []),
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  {
    id: menuIds.edit.root,
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
        id: menuIds.edit.deleteAllNotes,
        label: 'Delete All Notes...',
        accelerator: 'Shift+CmdOrCtrl+Backspace',
        enabled: false,
        click: () => {
          BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.deleteAllNotes);
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      {
        label: 'Toggle Full Screen',
        accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
        click: () => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          focusedWindow?.setFullScreen(!focusedWindow.isFullScreen());
        }
      }
    ]
  },
  { role: 'windowMenu' },
  {
    role: 'help',
    submenu: [
      {
        label: 'Welcome',
        click: () => {
          BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.showWelcome);
        }
      },
      { type: 'separator' },
      {
        label: 'View License',
        click: () => {
          createLicenseWindow();
        }
      },
      {
        label: 'Website',
        click: () => {
          shell.openExternal('https://solisware.com');
        }
      }
    ]
  }
];

const menubar = Menu.buildFromTemplate(template);

export default menubar;
