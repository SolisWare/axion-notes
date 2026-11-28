/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { BrowserWindowConstructorOptions } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeNoteWindows, createNoteWindow } from "../../../../electron/windows/createNoteWindow";
import { channels } from "../../../../electron/ipc/channels";
import { ElectronWindowId } from "../../../../src/types/ElectronWindowId";

type TestWindow = {
  close: ReturnType<typeof vi.fn>;
  events: Map<string, (...args: never[]) => void>;
  focus: ReturnType<typeof vi.fn>;
  getBounds: ReturnType<typeof vi.fn>;
  isDestroyed: ReturnType<typeof vi.fn>;
  isMinimized: ReturnType<typeof vi.fn>;
  loadFile: ReturnType<typeof vi.fn>;
  loadURL: ReturnType<typeof vi.fn>;
  moveTop: ReturnType<typeof vi.fn>;
  options: BrowserWindowConstructorOptions;
  restore: ReturnType<typeof vi.fn>;
  setMenu: ReturnType<typeof vi.fn>;
  setMenuBarVisibility: ReturnType<typeof vi.fn>;
  setTitle: ReturnType<typeof vi.fn>;
  show: ReturnType<typeof vi.fn>;
  webContents: {
    send: ReturnType<typeof vi.fn>;
  };
};

const mocks = vi.hoisted(() => ({
  blockProductionDevTools: vi.fn(),
  devRoute: vi.fn(),
  getAppIconPath: vi.fn(() => "/app/icon.png"),
  getAppIndexFilePath: vi.fn(() => "/app/index.html"),
  getAppWindowWebPreferences: vi.fn(() => ({ preload: "/app/preload.js" })),
  getWindowIconPath: vi.fn(() => "/window/icon.png"),
  isDev: false,
  isMac: false,
  registerRichTextShortcuts: vi.fn(),
  registerWindowNavigationGuards: vi.fn(),
  translate: vi.fn(() => "Note"),
  windows: [] as TestWindow[]
}));

vi.mock("electron", () => {
  class BrowserWindow {
    static getAllWindows = vi.fn(() => mocks.windows);

    readonly close = vi.fn(() => this.events.get("closed")?.());
    readonly events = new Map<string, (...args: never[]) => void>();
    readonly focus = vi.fn();
    readonly getBounds = vi.fn(() => ({ height: 700, width: 900, x: 100, y: 200 }));
    readonly isDestroyed = vi.fn(() => false);
    readonly isMinimized = vi.fn(() => false);
    readonly loadFile = vi.fn();
    readonly loadURL = vi.fn();
    readonly moveTop = vi.fn();
    readonly restore = vi.fn();
    readonly setMenu = vi.fn();
    readonly setMenuBarVisibility = vi.fn();
    readonly setTitle = vi.fn();
    readonly show = vi.fn();
    readonly webContents = { send: vi.fn() };
    readonly options: BrowserWindowConstructorOptions;

    constructor(options: BrowserWindowConstructorOptions) {
      this.options = options;
      mocks.windows.push(this as unknown as TestWindow);
    }

    on(event: string, listener: (...args: never[]) => void): void {
      this.events.set(event, listener);
    }

    once(event: string, listener: (...args: never[]) => void): void {
      this.events.set(event, listener);
    }
  }

  return { BrowserWindow };
});

vi.mock("../../../../electron/utils/appIcon", () => ({
  getAppIconPath: mocks.getAppIconPath,
  getWindowIconPath: mocks.getWindowIconPath
}));

vi.mock("../../../../electron/utils/devTools", () => ({
  blockProductionDevTools: mocks.blockProductionDevTools
}));

vi.mock("../../../../electron/utils/electronI18n", () => ({
  translate: mocks.translate
}));

vi.mock("../../../../electron/utils/isDev", () => ({
  get isDev() {
    return mocks.isDev;
  }
}));

vi.mock("../../../../electron/utils/Platform", () => ({
  get isMac() {
    return mocks.isMac;
  }
}));

vi.mock("../../../../electron/utils/richTextShortcuts", () => ({
  registerRichTextShortcuts: mocks.registerRichTextShortcuts
}));

vi.mock("../../../../electron/windows/routes", () => ({
  dev: mocks.devRoute
}));

vi.mock("../../../../electron/windows/windowSecurity", () => ({
  getAppIndexFilePath: mocks.getAppIndexFilePath,
  getAppWindowWebPreferences: mocks.getAppWindowWebPreferences,
  registerWindowNavigationGuards: mocks.registerWindowNavigationGuards
}));

beforeEach(() => {
  mocks.blockProductionDevTools.mockClear();
  mocks.devRoute.mockReset();
  mocks.devRoute.mockReturnValue("http://localhost:3000/#/note");
  mocks.getAppIconPath.mockClear();
  mocks.getAppIndexFilePath.mockClear();
  mocks.getAppWindowWebPreferences.mockClear();
  mocks.getWindowIconPath.mockClear();
  mocks.isDev = false;
  mocks.isMac = false;
  mocks.registerRichTextShortcuts.mockClear();
  mocks.registerWindowNavigationGuards.mockClear();
  mocks.translate.mockClear();
  mocks.windows.splice(0);
});

afterEach(() => {
  closeNoteWindows();
});

describe("createNoteWindow", () => {
  it("creates a localized hardened production window for a note", () => {
    const noteWindow = createNoteWindow({ noteId: "note-1" }) as unknown as TestWindow;

    expect(noteWindow.options).toMatchObject({
      autoHideMenuBar: true,
      height: 700,
      icon: "/window/icon.png",
      minHeight: 600,
      minWidth: 800,
      show: false,
      title: "Axion Notes — Note",
      width: 900,
      webPreferences: { preload: "/app/preload.js" }
    });
    expect(noteWindow.setMenu).toHaveBeenCalledWith(null);
    expect(noteWindow.setMenuBarVisibility).toHaveBeenCalledWith(false);
    expect(mocks.registerRichTextShortcuts).toHaveBeenCalledWith(noteWindow);
    expect(mocks.blockProductionDevTools).toHaveBeenCalledWith(noteWindow);
    expect(mocks.registerWindowNavigationGuards).toHaveBeenCalledWith(noteWindow, { allowedFilePaths: ["/app/index.html"] });
    expect(noteWindow.loadFile).toHaveBeenCalledWith(expect.stringMatching(/[\\/]index\.html$/), {
      hash: `/${ElectronWindowId.NOTE}`,
      query: { noteId: "note-1" }
    });
  });

  it("shows only when ready and prevents note content from changing the localized title", () => {
    const noteWindow = createNoteWindow({ noteId: "note-1" }) as unknown as TestWindow;
    const readyToShow = getWindowEventHandler(noteWindow, "ready-to-show");
    const titleEvent = { preventDefault: vi.fn() };

    readyToShow();
    getWindowEventHandler(noteWindow, "page-title-updated")(titleEvent as never);

    expect(noteWindow.show).toHaveBeenCalledOnce();
    expect(titleEvent.preventDefault).toHaveBeenCalledOnce();
    expect(noteWindow.setTitle).toHaveBeenCalledWith("Axion Notes — Note");
  });

  it("reuses, restores, and focuses an existing note window", () => {
    const noteWindow = createNoteWindow({ noteId: "note-1" }) as unknown as TestWindow;
    noteWindow.isMinimized.mockReturnValue(true);

    expect(createNoteWindow({ noteId: "note-1" })).toBe(noteWindow);
    expect(mocks.windows).toHaveLength(1);
    expect(noteWindow.restore).toHaveBeenCalledOnce();
    expect(noteWindow.show).toHaveBeenCalledOnce();
    expect(noteWindow.moveTop).toHaveBeenCalledOnce();
    expect(noteWindow.focus).toHaveBeenCalledOnce();
  });

  it("focuses an existing non-minimized note window without restoring it", () => {
    const noteWindow = createNoteWindow({ noteId: "note-1" }) as unknown as TestWindow;

    createNoteWindow({ noteId: "note-1" });

    expect(noteWindow.restore).not.toHaveBeenCalled();
    expect(noteWindow.show).toHaveBeenCalledOnce();
    expect(noteWindow.moveTop).toHaveBeenCalledOnce();
    expect(noteWindow.focus).toHaveBeenCalledOnce();
  });

  it("offsets each later note window from the latest open note window", () => {
    const firstWindow = createNoteWindow({ noteId: "first" }) as unknown as TestWindow;
    firstWindow.getBounds.mockReturnValue({ height: 700, width: 900, x: 100, y: 200 });
    const openerWindow = {} as never;

    const secondWindow = createNoteWindow({ noteId: "second", openerWindow }) as unknown as TestWindow;
    secondWindow.getBounds.mockReturnValue({ height: 700, width: 900, x: 128, y: 228 });
    const thirdWindow = createNoteWindow({ noteId: "third", openerWindow }) as unknown as TestWindow;

    expect(secondWindow.options).toMatchObject({ x: 128, y: 228 });
    expect(thirdWindow.options).toMatchObject({ x: 156, y: 256 });
  });

  it("uses the opener as an offset base and does not offset when no live note window exists", () => {
    const openerWindow = createNoteWindow({ noteId: "opener" }) as unknown as TestWindow;
    openerWindow.getBounds.mockReturnValue({ height: 700, width: 900, x: 100, y: 200 });

    const offsetWindow = createNoteWindow({ noteId: "offset", openerWindow: openerWindow as never }) as unknown as TestWindow;
    openerWindow.isDestroyed.mockReturnValue(true);
    offsetWindow.isDestroyed.mockReturnValue(true);
    const unoffsetWindow = createNoteWindow({ noteId: "unoffset", openerWindow: openerWindow as never }) as unknown as TestWindow;

    expect(offsetWindow.options).toMatchObject({ x: 128, y: 228 });
    expect(unoffsetWindow.options).not.toHaveProperty("x");
    expect(unoffsetWindow.options).not.toHaveProperty("y");
  });

  it("removes a closed note window, notifies remaining windows, and creates it again when reopened", () => {
    const firstWindow = createNoteWindow({ noteId: "note-1" }) as unknown as TestWindow;
    const secondWindow = createNoteWindow({ noteId: "note-2" }) as unknown as TestWindow;

    getWindowEventHandler(firstWindow, "closed")();

    expect(secondWindow.webContents.send).toHaveBeenCalledWith(channels.noteWindow.closed, "note-1");
    const reopenedWindow = createNoteWindow({ noteId: "note-1" }) as unknown as TestWindow;
    expect(reopenedWindow).not.toBe(firstWindow);
  });

  it("closes only live note windows", () => {
    const liveWindow = createNoteWindow({ noteId: "live" }) as unknown as TestWindow;
    const destroyedWindow = createNoteWindow({ noteId: "destroyed" }) as unknown as TestWindow;
    destroyedWindow.isDestroyed.mockReturnValue(true);

    closeNoteWindows();

    expect(liveWindow.close).toHaveBeenCalledOnce();
    expect(destroyedWindow.close).not.toHaveBeenCalled();
  });

  it("uses the encoded development note route and macOS application icon", () => {
    mocks.isDev = true;
    mocks.isMac = true;

    const noteWindow = createNoteWindow({ noteId: "note / ?" }) as unknown as TestWindow;

    expect(mocks.devRoute).toHaveBeenCalledWith(ElectronWindowId.NOTE);
    expect(noteWindow.loadURL).toHaveBeenCalledWith("http://localhost:3000/?noteId=note%20%2F%20%3F#/note");
    expect(noteWindow.loadFile).not.toHaveBeenCalled();
    expect(mocks.getAppIconPath).toHaveBeenCalledOnce();
    expect(mocks.getWindowIconPath).not.toHaveBeenCalled();
  });
});

function getWindowEventHandler(window: TestWindow, eventName: string): (...args: never[]) => void {
  const handler = window.events.get(eventName);

  if (!handler) {
    throw new Error(`Could not find the ${eventName} handler.`);
  }

  return handler;
}
