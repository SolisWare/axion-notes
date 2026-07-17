/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, LoadFileOptions } from "electron";
import * as path from "path";
import { isDev } from "../utils/isDev";
import { getAppIconPath, getWindowIconPath } from "../utils/appIcon";
import { isMac } from "../utils/Platform";
import { translate } from "../utils/electronI18n";
import { dev } from "./routes";

const noteWindows = new Map<string, BrowserWindow>();
const NOTE_WINDOW_OFFSET = 28;

type CreateNoteWindowOptions = {
  noteId: string;
  openerWindow?: BrowserWindow;
};

function getLatestNoteWindow(): BrowserWindow | undefined {
  return [...noteWindows.values()]
    .reverse()
    .find((window) => !window.isDestroyed());
}

function getOffsetBaseWindow(openerWindow?: BrowserWindow): BrowserWindow | undefined {
  if (!openerWindow) {
    return undefined;
  }

  const latestNoteWindow = getLatestNoteWindow();

  if (latestNoteWindow === openerWindow) {
    return openerWindow;
  }

  if (latestNoteWindow) {
    return latestNoteWindow;
  }

  return undefined;
}

function getNoteWindowRoute(noteId: string): string {
  const noteRoute = dev("note");
  const [baseUrl, hashRoute] = noteRoute.split("#");

  return `${baseUrl}?noteId=${encodeURIComponent(noteId)}#${hashRoute}`;
}

function getProductionNoteWindowRoute(noteId: string): [string, LoadFileOptions] {
  return [
    path.join(__dirname, "../../index.html"),
    {
      hash: "/note",
      query: {
        noteId
      }
    }
  ];
}

export function createNoteWindow(options: CreateNoteWindowOptions): BrowserWindow {
  const { noteId } = options;
  const existingWindow = noteWindows.get(noteId);

  if (existingWindow && !existingWindow.isDestroyed()) {
    existingWindow.focus();
    return existingWindow;
  }

  const windowTitle = `Axion Notes — ${translate("electron.windows.note")}`;
  const offsetBaseBounds = getOffsetBaseWindow(options.openerWindow)?.getBounds();

  const noteWindow = new BrowserWindow({
    ...(offsetBaseBounds ? {
      x: offsetBaseBounds.x + NOTE_WINDOW_OFFSET,
      y: offsetBaseBounds.y + NOTE_WINDOW_OFFSET
    } : {}),
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: isMac ? getAppIconPath() : getWindowIconPath(),
    title: windowTitle,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "../preload/preload.js")
    }
  });

  noteWindows.set(noteId, noteWindow);
  noteWindow.setMenu(null);
  noteWindow.setMenuBarVisibility(false);

  noteWindow.once("ready-to-show", () => {
    noteWindow.show();
  });

  noteWindow.on("closed", () => {
    noteWindows.delete(noteId);
  });

  noteWindow.on("page-title-updated", (event) => {
    event.preventDefault();
    noteWindow.setTitle(windowTitle);
  });

  if (isDev) {
    noteWindow.loadURL(getNoteWindowRoute(noteId));
  } else {
    noteWindow.loadFile(...getProductionNoteWindowRoute(noteId));
  }

  return noteWindow;
}
