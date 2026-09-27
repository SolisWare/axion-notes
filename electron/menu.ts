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
import { withEllipsis } from "../src/utils/text";

type MenubarOptions = {
  onLockNotes: () => void | Promise<void>;
  onSecureLock: () => void | Promise<void>;
};

export function createMenubar(options: MenubarOptions): Menu {
  const template: any = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: translate("aboutApp", { appName: "Axion Notes" }) },
        { type: 'separator' },
        {
          id: menuIds.app.settings,
          label: withEllipsis(translate("settings")),
          accelerator: 'Cmd+,',
          click: () => {
            createSettingsWindow();
          }
        },
        { type: 'separator' },
        {
          id: menuIds.app.lockNotes,
          label: translate("lockNotes"),
          accelerator: 'Shift+CmdOrCtrl+L',
          click: () => {
            options.onLockNotes();
          }
        },
        {
          id: menuIds.app.secureLock,
          label: translate("secureLock"),
          accelerator: 'Alt+Shift+CmdOrCtrl+L',
          click: () => {
            options.onSecureLock();
          }
        },
        { type: 'separator' },
        { role: 'services', label: translate("services") },
        { type: 'separator' },
        { role: 'hide', label: translate("hide") },
        { role: 'hideOthers', label: translate("hideOthers") },
        { role: 'unhide', label: translate("showAll") },
        { type: 'separator' },
        { role: 'quit', label: translate("quit") },
      ]
    }] : []),
    {
      id: menuIds.file.root,
      label: translate("file"),
      submenu: [
        ...(isWindows ? [
          { role: 'about' as const, label: translate("aboutApp", { appName: "Axion Notes" }) },
          { type: 'separator' as const }
        ] : []),
        {
          id: menuIds.file.newNote,
          label: withEllipsis(translate("newNote")),
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.newNote);
          }
        },
        { type: 'separator' },
        ...(!isMac ? [
          {
            id: menuIds.file.lockNotes,
            label: translate("lockNotes"),
            accelerator: 'Shift+CmdOrCtrl+L',
            click: () => {
              options.onLockNotes();
            }
          },
          {
            id: menuIds.file.secureLock,
            label: translate("secureLock"),
            accelerator: 'Alt+Shift+CmdOrCtrl+L',
            click: () => {
              options.onSecureLock();
            }
          },
          { type: 'separator' as const }
        ] : []),
        ...(isWindows ? [
          {
            id: menuIds.file.settings,
            label: withEllipsis(translate("settings")),
            click: () => {
              createSettingsWindow();
            }
          },
          { type: 'separator' as const }
        ] : []),
        isMac
          ? { role: 'close', label: translate("close") }
          : { role: 'quit', label: translate("quit") }
      ]
    },
    {
      id: menuIds.edit.root,
      label: translate("edit"),
      submenu: [
        { role: 'undo', label: translate("undo") },
        { role: 'redo', label: translate("redo") },
        { type: 'separator' },
        { id: menuIds.edit.cut, role: 'cut', label: translate("cut"), enabled: false },
        { id: menuIds.edit.copy, role: 'copy', label: translate("copy"), enabled: false },
        { id: menuIds.edit.paste, role: 'paste', label: translate("paste"), enabled: false },
        { role: 'selectAll', label: translate("selectAll") },
        ...(isMac ? [
          { id: menuIds.edit.delete, role: 'delete' as const, label: translate("delete"), enabled: false }
        ] : []),
        { type: 'separator' },
        {
          id: menuIds.edit.selectNote,
          label: withEllipsis(translate("selectNotes")),
          accelerator: 'Shift+CmdOrCtrl+A',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.selectNote);
          }
        },
        {
          id: menuIds.edit.selectAllNotes,
          label: translate("selectAllNotes"),
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.selectAllNotes);
          }
        },
        {
          id: menuIds.edit.cancelNoteSelection,
          label: translate("cancelNoteSelection"),
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.cancelNoteSelection);
          }
        },
        { type: 'separator' },
        {
          id: menuIds.edit.deleteAllNotes,
          label: withEllipsis(translate("deleteAllNotes")),
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
      label: translate("format"),
      enabled: false,
      submenu: [
        {
          id: menuIds.format.bold,
          label: translate("formatting.bold"),
          accelerator: 'CmdOrCtrl+B',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.BOLD);
          }
        },
        {
          id: menuIds.format.italic,
          label: translate("formatting.italic"),
          accelerator: 'CmdOrCtrl+I',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.ITALIC);
          }
        },
        {
          id: menuIds.format.underline,
          label: translate("formatting.underline"),
          accelerator: 'CmdOrCtrl+U',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.UNDERLINE);
          }
        },
        {
          id: menuIds.format.strikethrough,
          label: translate("formatting.strikethrough"),
          accelerator: 'Shift+CmdOrCtrl+X',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.STRIKETHROUGH);
          }
        },
        {
          id: menuIds.format.highlight,
          label: translate("formatting.highlight"),
          accelerator: 'Shift+CmdOrCtrl+H',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.HIGHLIGHT);
          }
        },
        {
          id: menuIds.format.inlineCode,
          label: translate("formatting.inlineCode"),
          accelerator: 'CmdOrCtrl+M',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.INLINE_CODE);
          }
        },
        { type: 'separator' },
        {
          id: menuIds.format.superscript,
          label: translate("formatting.superscript"),
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.SUPERSCRIPT);
          }
        },
        {
          id: menuIds.format.subscript,
          label: translate("formatting.subscript"),
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.SUBSCRIPT);
          }
        },
        { type: 'separator' },
        {
          id: menuIds.format.bulletList,
          label: translate("formatting.bulletList"),
          accelerator: 'Shift+CmdOrCtrl+6',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.BULLET_LIST);
          }
        },
        {
          id: menuIds.format.dashedList,
          label: translate("formatting.dashedList"),
          accelerator: 'Shift+CmdOrCtrl+7',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.DASHED_LIST);
          }
        },
        {
          id: menuIds.format.numberedList,
          label: translate("formatting.numberedList"),
          accelerator: 'Shift+CmdOrCtrl+8',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.NUMBERED_LIST);
          }
        },
        {
          id: menuIds.format.checklist,
          label: translate("formatting.checklist"),
          accelerator: 'Shift+CmdOrCtrl+9',
          type: 'checkbox',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.CHECKLIST);
          }
        },
        { type: 'separator' },
        {
          id: menuIds.format.fontSize.root,
          label: translate("formatting.fontSize"),
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
          label: translate("formatting.font"),
          enabled: false,
          submenu: NOTE_FONT_CATEGORIES.map((fontCategory) => ({
            label: translate(`fontCategories.${fontCategory}`),
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
        },
        { type: 'separator' },
        {
          id: menuIds.format.clearFormatting,
          label: translate("formatting.clearFormatting"),
          accelerator: 'CmdOrCtrl+\\',
          enabled: false,
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.formatRichText, RichTextFormatCommand.CLEAR_FORMATTING);
          }
        }
      ]
    },
    {
      id: menuIds.view.root,
      label: translate("view"),
      submenu: [
        { role: 'reload', label: translate("reload") },
        { type: 'separator' },
        { role: 'resetZoom', label: translate("zoomActualSize") },
        { role: 'zoomIn', label: translate("zoomIn") },
        { role: 'zoomOut', label: translate("zoomOut") },
        { type: 'separator' },
        {
          id: menuIds.view.toggleFullScreen,
          label: translate("toggleFullScreen"),
          accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            focusedWindow?.setFullScreen(!focusedWindow.isFullScreen());
          }
        }
      ]
    },
    { role: 'windowMenu', label: translate("window") },
    {
      role: 'help',
      id: menuIds.help.root,
      label: translate("help"),
      submenu: [
        {
          id: menuIds.help.welcome,
          label: translate("welcome"),
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(channels.menu.showWelcome);
          }
        },
        { type: 'separator' },
        {
          id: menuIds.help.viewLicense,
          label: translate("viewLicense"),
          click: () => {
            createLicenseWindow();
          }
        },
        {
          id: menuIds.help.visitWebsite,
          label: translate("visitWebsite"),
          click: () => {
            shell.openExternal('https://solisware.com');
          }
        },
        {
          id: menuIds.help.checkoutGitHub,
          label: translate("checkoutGitHub"),
          click: () => {
            shell.openExternal('https://github.com/SolisWare');
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}
