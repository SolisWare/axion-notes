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
import { translate } from "./utils/electronI18n";

export function createMenubar(): Menu {
  const template: any = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          id: menuIds.app.settings,
          label: translate("electron.menu.settings"),
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
      label: translate("electron.menu.file"),
      submenu: [
        ...(isWindows ? [
          { role: 'about' as const },
          { type: 'separator' as const }
        ] : []),
        {
          id: menuIds.file.newNote,
          label: translate("electron.menu.newNote"),
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.newNote);
          }
        },
        { type: 'separator' },
        ...(isWindows ? [
          {
            id: menuIds.file.settings,
            label: translate("electron.menu.settings"),
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
      label: translate("electron.menu.edit"),
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
          label: translate("electron.menu.deleteAllNotes"),
          accelerator: 'Shift+CmdOrCtrl+Backspace',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.deleteAllNotes);
          }
        }
      ]
    },
    {
      label: translate("electron.menu.view"),
      submenu: [
        { role: 'reload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        {
          label: translate("electron.menu.toggleFullScreen"),
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
          label: translate("electron.menu.welcome"),
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.showWelcome);
          }
        },
        { type: 'separator' },
        {
          label: translate("electron.menu.viewLicense"),
          click: () => {
            createLicenseWindow();
          }
        },
        {
          label: translate("electron.menu.visitWebsite"),
          click: () => {
            shell.openExternal('https://solisware.com');
          }
        },
        {
          label: translate("electron.menu.checkoutGitHub"),
          click: () => {
            shell.openExternal('https://github.com/SolisWare');
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}
