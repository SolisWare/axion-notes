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
import { RichTextFormatCommand } from "../src/models/RichTextFormatCommand";
import { NOTE_FONT_CATEGORIES, NOTE_FONT_OPTIONS } from "../src/settings/NoteFontPreference";
import { NOTE_CONTENT_FONT_SIZE_OPTIONS } from "../src/settings/NoteFontSize";

export function createMenubar(): Menu {
  const template: any = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: translate("electron.menu.about", { appName: "Axion Notes" }) },
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
        { role: 'services', label: translate("electron.menu.services") },
        { type: 'separator' },
        { role: 'hide', label: translate("electron.menu.hide") },
        { role: 'hideOthers', label: translate("electron.menu.hideOthers") },
        { role: 'unhide', label: translate("electron.menu.unhide") },
        { type: 'separator' },
        { role: 'quit', label: translate("electron.menu.quit") },
      ]
    }] : []),
    {
      label: translate("electron.menu.file"),
      submenu: [
        ...(isWindows ? [
          { role: 'about' as const, label: translate("electron.menu.about", { appName: "Axion Notes" }) },
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
        isMac
          ? { role: 'close', label: translate("electron.menu.close") }
          : { role: 'quit', label: translate("electron.menu.quit") }
      ]
    },
    {
      id: menuIds.edit.root,
      label: translate("electron.menu.edit"),
      submenu: [
        { role: 'undo', label: translate("electron.menu.undo") },
        { role: 'redo', label: translate("electron.menu.redo") },
        { type: 'separator' },
        { id: menuIds.edit.cut, role: 'cut', label: translate("electron.menu.cut"), enabled: false },
        { id: menuIds.edit.copy, role: 'copy', label: translate("electron.menu.copy"), enabled: false },
        { id: menuIds.edit.paste, role: 'paste', label: translate("electron.menu.paste"), enabled: false },
        { role: 'selectAll', label: translate("electron.menu.selectAll") },
        ...(isMac ? [
          { id: menuIds.edit.delete, role: 'delete' as const, label: translate("electron.menu.delete"), enabled: false }
        ] : []),
        { type: 'separator' },
        {
          id: menuIds.edit.selectNote,
          label: translate("electron.menu.selectNotes"),
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.selectNote);
          }
        },
        {
          id: menuIds.edit.selectAllNotes,
          label: translate("electron.menu.selectAllNotes"),
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.selectAllNotes);
          }
        },
        {
          id: menuIds.edit.cancelNoteSelection,
          label: translate("electron.menu.cancelNoteSelection"),
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.cancelNoteSelection);
          }
        },
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
      id: menuIds.format.root,
      label: translate("electron.menu.format"),
      enabled: false,
      submenu: [
        {
          id: menuIds.format.bold,
          label: translate("electron.menu.bold"),
          accelerator: 'CmdOrCtrl+B',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.BOLD);
          }
        },
        {
          id: menuIds.format.italic,
          label: translate("electron.menu.italic"),
          accelerator: 'CmdOrCtrl+I',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.ITALIC);
          }
        },
        {
          id: menuIds.format.underline,
          label: translate("electron.menu.underline"),
          accelerator: 'CmdOrCtrl+U',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.UNDERLINE);
          }
        },
        {
          id: menuIds.format.strikethrough,
          label: translate("electron.menu.strikethrough"),
          accelerator: 'Shift+CmdOrCtrl+X',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.STRIKETHROUGH);
          }
        },
        { type: 'separator' },
        {
          id: menuIds.format.superscript,
          label: translate("electron.menu.superscript"),
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.SUPERSCRIPT);
          }
        },
        {
          id: menuIds.format.subscript,
          label: translate("electron.menu.subscript"),
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.SUBSCRIPT);
          }
        },
        { type: 'separator' },
        {
          id: menuIds.format.bulletList,
          label: translate("electron.menu.bulletList"),
          accelerator: 'Shift+CmdOrCtrl+7',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.BULLET_LIST);
          }
        },
        {
          id: menuIds.format.dashedList,
          label: translate("electron.menu.dashedList"),
          accelerator: 'Shift+CmdOrCtrl+8',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.DASHED_LIST);
          }
        },
        {
          id: menuIds.format.numberedList,
          label: translate("electron.menu.numberedList"),
          accelerator: 'Shift+CmdOrCtrl+9',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.NUMBERED_LIST);
          }
        },
        { type: 'separator' },
        {
          id: menuIds.format.fontSize.root,
          label: translate("electron.menu.fontSize"),
          enabled: false,
          submenu: NOTE_CONTENT_FONT_SIZE_OPTIONS.map((fontSize) => ({
            id: menuIds.format.fontSize.option(fontSize),
            label: `${fontSize}`,
            type: 'checkbox',
            enabled: false,
            click: () => {
              BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, {
                command: RichTextFormatCommand.FONT_SIZE,
                fontSize
              });
            }
          }))
        },
        {
          id: menuIds.format.fontFamily.root,
          label: translate("electron.menu.font"),
          enabled: false,
          submenu: NOTE_FONT_CATEGORIES.map((fontCategory) => ({
            label: translate(`settingsWindow.editor.noteFontCategories.${fontCategory}`),
            submenu: NOTE_FONT_OPTIONS
              .filter((fontOption) => fontOption.category === fontCategory)
              .map((fontOption) => ({
                id: menuIds.format.fontFamily.option(fontOption.value),
                label: translate(fontOption.labelKey),
                type: 'checkbox',
                enabled: false,
                click: () => {
                  BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, {
                    command: RichTextFormatCommand.FONT_FAMILY,
                    noteFont: fontOption.value
                  });
                }
              }))
          }))
        }
      ]
    },
    {
      label: translate("electron.menu.view"),
      submenu: [
        { role: 'reload', label: translate("electron.menu.reload") },
        { type: 'separator' },
        { role: 'resetZoom', label: translate("electron.menu.resetZoom") },
        { role: 'zoomIn', label: translate("electron.menu.zoomIn") },
        { role: 'zoomOut', label: translate("electron.menu.zoomOut") },
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
    { role: 'windowMenu', label: translate("electron.menu.window") },
    {
      role: 'help',
      label: translate("electron.menu.help"),
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
