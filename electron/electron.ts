/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app, BrowserWindow, ipcMain, LoadFileOptions, Menu, nativeTheme, screen } from "electron";
import * as path from "path";
import { createFileRoute, createURLRoute } from 'electron-router-dom'
import menubar from "./menu";
import isDev from "electron-is-dev";
import { isMac } from './utils/Platform';
import * as fs from 'node:fs';
import { NoteType } from "../src/models/NoteType";
import appVersionConfig from "../app-version-config.json";
import { AppVersionResolver } from "../scripts/app-version/AppVersionResolver";
import { resolveSystemTheme } from "../src/theme/SystemTheme";
import { AppSettings } from "../src/settings/AppSettings";
import { defaultMainWindowBounds } from "../src/settings/defaultSettings";
import { AppWindowBounds } from "../src/settings/AppWindowBounds";

const appDir = path.join(app.getPath("userData"));
const appDataDir = path.join(appDir, 'data');
const appSettingsDir = path.join(appDir, 'settings');
const appSettingsFilePath = path.join(appSettingsDir, 'app-settings.json');
const mainWindowBoundsFilePath = path.join(appSettingsDir, 'main-window-bounds.json');

const systemThemeSubscribers = new Set<number>();

// Create the 'data' directory if it doesn't exist.
if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
}
// Create the 'settings' directory if it doesn't exist.
if (!fs.existsSync(appSettingsDir)) {
  fs.mkdirSync(appSettingsDir, { recursive: true });
}

// Load variables from ".env" file and merge with "process.env"
// FOR DEV MODE ONLY!
if (isDev) {
  // Load dotenv only in development so production packages do not require it.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
}

// Load index.html as the app entry point for production
// and listen on "http://localhost:3000" in 'dev' mode.
const dev = (handle: string): string => {
  return createURLRoute(
    "http://localhost:3000",
    handle
  ).toString();
};

const production = (handle: string): [string, LoadFileOptions] => {
  return createFileRoute(
    path.join(__dirname, "/../index.html"),
    handle
  );
};

const createMainWindow = () => {
  const mainWindowBounds = readMainWindowBounds();

  // Create the browser window.
  const win = new BrowserWindow({
    ...mainWindowBounds,
    minWidth: 335,
    minHeight: 250,
    show: false,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', () => {
    saveMainWindowBoundsOnClose(win);
  });
  
  if (isDev) {
    // Load the URL for the main window
    win.loadURL(dev("main"));
    // Open DevTools when running in dev mode
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(...production("main"));
  }
};

// Load the menubar items
Menu.setApplicationMenu(menubar);

// This method is called when Electron has finished the initialization
// and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createMainWindow();

  nativeTheme.on("updated", () => handleSystemTheme());
  ipcMain.handle("systemTheme.onThemeChange", handleSystemTheme);
  
  ipcMain.on('storage.setNote', (_, ...args: any[]) => {
    const note = args[0][0] as NoteType;
    const filePath = path.join(appDataDir, `${note.id}.json`);
    const serializedNote = JSON.stringify(note);

    fs.writeFile(filePath, serializedNote, (err) => {
      if (err) {
        console.error(err);
        // TODO: Throw an exception and send callback to the renderer.
      }
    });
  });
  
  ipcMain.handle('storage.getNotes', async () => {
    const files = await fs.promises.readdir(appDataDir);
    const notes = await Promise.all(
      files.map(async (file): Promise<NoteType | null> => {
        try {
          const filePath = path.join(appDataDir, file);
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const parsed = JSON.parse(content) as NoteType;

          return {
            ...parsed,
            createdOn: new Date(parsed.createdOn),
            lastModifiedOn: new Date(parsed.lastModifiedOn)
          };
        } catch (err) {
          console.warn(`Skipping corrupt note file: ${file}`);
          // TODO: We might want to consider an exception so a warning can be displayed.
          return null;
        }
      })
    );
    return notes
      .filter((note): note is NoteType => note !== null)
      .sort((oldestNote, latestNote) => oldestNote.createdOn.getTime() - latestNote.createdOn.getTime());
  });

  ipcMain.on('storage.deleteNote', (_, ...args: any[]) => {
    const noteId = args[0][0];
    const filePath = path.join(appDataDir, `${noteId}.json`);

    console.log('Deleting:', filePath);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log(err);
        // TODO: Error handling
      }
    });
  });

  ipcMain.on('storage.deleteAllNotes', (_, ...args: any[]) => {
    console.log('Deleting all files in :', appDataDir);
    fs.promises.readdir(appDataDir)
      .then((files) => Promise.all(
        files
          .map((file) => fs.promises.unlink(path.join(appDataDir, file)))
      ))
      .catch((err) => {
        console.log(err);
        // TODO: Error handling
      });
  });

  ipcMain.handle('settings.getSettings', async () => {
    return fs.promises.readFile(appSettingsFilePath, 'utf-8')
      .then((content): AppSettings | undefined => {
        if (!content.trim()) {
          return undefined;
        }
        return JSON.parse(content) as AppSettings;
      })
      .catch((err): AppSettings | undefined => {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          return undefined;
        }
        console.warn('Failed to read app settings:', err);
        return undefined;
      });
  });

  ipcMain.on('settings.setSettings', (_, ...args: any[]) => {
    const settings = args[0][0] as AppSettings;
    const serializedSettings = JSON.stringify(settings, null, 2);

    fs.promises.writeFile(appSettingsFilePath, serializedSettings)
      .catch((err) => {
        console.warn('Failed to write app settings:', err);
      });
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

// On macOS it's common to re-create a window in the app 
// when the dock icon is clicked and there are no other windows opened.
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// "About" dialog window customization
app.setAboutPanelOptions({
  applicationName: "X-NoTES",
  applicationVersion: AppVersionResolver.getCombinedVersion(appVersionConfig),
  ...(AppVersionResolver.getAboutVersion(appVersionConfig) ? { version: AppVersionResolver.getAboutVersion(appVersionConfig) } : {}),
  authors: [
    "SolisWare"
  ],
  copyright: "Copyright © 2023-2026 SolisWare.\nAll rights reserved."
});

function handleSystemTheme(event?: Electron.IpcMainInvokeEvent) {
  const systemTheme = resolveSystemTheme(nativeTheme.shouldUseDarkColors);

  if (event) {
    systemThemeSubscribers.add(event.sender.id);

    event.sender.once("destroyed", () => {
      systemThemeSubscribers.delete(event.sender.id);
    });

    return systemTheme;
  }

  BrowserWindow.getAllWindows().forEach((window) => {
    const webContents = window.webContents;

    if (systemThemeSubscribers.has(webContents.id) && !webContents.isDestroyed()) {
      webContents.send("systemTheme.onThemeChange", systemTheme);
    }
  });
}

function saveMainWindowBoundsOnClose(window: BrowserWindow): void {
  const currentBounds = window.getBounds();

  fs.writeFileSync(mainWindowBoundsFilePath, `${JSON.stringify(currentBounds, null, 2)}\n`);
}

function readMainWindowBounds(): AppWindowBounds {
  try {
    const content = fs.readFileSync(mainWindowBoundsFilePath, 'utf-8');

    if (!content.trim()) {
      return defaultMainWindowBounds;
    }

    return getVisibleMainWindowBounds(JSON.parse(content) as AppWindowBounds);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return defaultMainWindowBounds;
    }

    console.warn('Failed to read main window bounds:', err);
    return defaultMainWindowBounds;
  }
}

function getVisibleMainWindowBounds(bounds: AppWindowBounds): AppWindowBounds {
  if (bounds.x === undefined || bounds.y === undefined || isWindowVisibleOnAnyDisplay(bounds)) {
    return bounds;
  }

  return {
    width: bounds.width,
    height: bounds.height
  };
}

function isWindowVisibleOnAnyDisplay(bounds: AppWindowBounds): boolean {
  return screen.getAllDisplays().some((display) => {
    const displayBounds = display.bounds;

    return bounds.x! < displayBounds.x + displayBounds.width
      && bounds.x! + bounds.width > displayBounds.x
      && bounds.y! < displayBounds.y + displayBounds.height
      && bounds.y! + bounds.height > displayBounds.y;
  });
}
