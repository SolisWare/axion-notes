/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SystemTheme } from "../../../src/theme/SystemTheme";

const i18n = vi.hoisted(() => ({ t: vi.fn() }));
const getShortDisplayVersion = vi.hoisted(() => vi.fn());
const userAgent = vi.hoisted(() => ({ isMac: false, isWindows: false }));
const browserBackupApi = vi.hoisted(() => ({ createArchive: vi.fn() }));
const browserRestoreApi = vi.hoisted(() => ({ inspect: vi.fn() }));
const settingsApi = vi.hoisted(() => ({ getSettings: vi.fn() }));
const storageApi = vi.hoisted(() => ({ getNotes: vi.fn() }));
const originalVersionConfig = import.meta.env.VITE_APP_VERSION_CONFIG;

vi.mock("../../../src/i18n/i18n", () => ({ default: i18n }));
vi.mock("../../../src/utils/app-version/AppVersionResolver", () => ({
  AppVersionResolver: { getShortDisplayVersion }
}));
vi.mock("../../../src/utils/UserAgent", () => ({ UserAgent: userAgent }));
vi.mock("../../../src/browser/backup/browserBackupApi", () => ({ browserBackupApi }));
vi.mock("../../../src/browser/backup/browserRestoreApi", () => ({ browserRestoreApi }));
vi.mock("../../../src/browser/storage/settingsApi", () => ({ settingsApi }));
vi.mock("../../../src/browser/storage/storageApi", () => ({ storageApi }));

describe("browserApi", () => {
  beforeEach(() => {
    Reflect.deleteProperty(window, "api");
    i18n.t.mockReset().mockReturnValue("Web");
    getShortDisplayVersion.mockReset().mockReturnValue("vtest");
    userAgent.isMac = false;
    userAgent.isWindows = false;
    delete import.meta.env.VITE_APP_VERSION_CONFIG;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalVersionConfig === undefined) {
      delete import.meta.env.VITE_APP_VERSION_CONFIG;
    } else {
      import.meta.env.VITE_APP_VERSION_CONFIG = originalVersionConfig;
    }

    Reflect.deleteProperty(window, "api");
    vi.restoreAllMocks();
  });

  it("installs the browser implementations and safe desktop no-ops", async () => {
    userAgent.isMac = true;
    const { installBrowserApi } = await import("../../../src/browser/browserApi");

    installBrowserApi();

    expect(window.api.backup).toBe(browserBackupApi);
    expect(window.api.restore).toBe(browserRestoreApi);
    expect(window.api.settings).toBe(settingsApi);
    expect(window.api.storage).toBe(storageApi);
    expect(window.api.os).toEqual({ isMac: true, isWindows: false });
    expect(window.api.version.getShortDisplayVersion()).toBe("Web");
    expect(window.api.noteWindow.onClosed(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuNewNote(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuSetNoteLayout(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuSetNoteSortOrder(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuResortNotes(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuShowWelcome(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuSelectNote(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuSelectAllNotes(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuCancelNoteSelection(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuDeleteAllNotes(vi.fn())()).toBeUndefined();
    expect(window.api.menu.onMenuRichTextFormat(vi.fn())()).toBeUndefined();
    expect(window.api.security.onEncryptionProgress(vi.fn())()).toBeUndefined();
    expect(window.api.security.onLockStateChange(vi.fn())()).toBeUndefined();
    expect(window.api.security.onSecureLockComplete(vi.fn())()).toBeUndefined();

    window.api.appWindow.close();
    window.api.appWindow.readyToShow();
    window.api.appWindow.setAlwaysOnTop(true);
    window.api.appWindow.setLayout("grid");
    window.api.noteWindow.open("note-1");
    window.api.menu.setDeleteAllNotesEnabled(true);
    window.api.menu.setEditSelectionState({ hasEditableSelection: false, hasSelection: false });
    window.api.menu.setNoteSelectionState({ areAllNotesSelected: false, hasNotes: false, isSelectionMode: false });
    window.api.menu.setRichTextFormatState({ canFormat: false, isBoldActive: false, isBulletListActive: false, isChecklistActive: false, isDashedListActive: false, isFontMixed: false, isFontSizeMixed: false, isHighlightActive: false, isInlineCodeActive: false, isItalicActive: false, isNumberedListActive: false, isStrikethroughActive: false, isSubscriptActive: false, isSuperscriptActive: false, isUnderlineActive: false });
    window.api.menu.setNewNoteEnabled(true);
  });

  it("provides browser security defaults", async () => {
    const { installBrowserApi } = await import("../../../src/browser/browserApi");
    installBrowserApi();

    await expect(window.api.security.changePassword("old", "new")).resolves.toBe(false);
    await expect(window.api.security.clearPassword()).resolves.toBe(false);
    await expect(window.api.security.disableEncryption("password")).resolves.toBe(false);
    await expect(window.api.security.enableEncryption("password")).resolves.toBe(false);
    await expect(window.api.security.getLockState()).resolves.toEqual({ isLocked: false, isRecoveryRequired: false });
    await expect(window.api.security.getSecurityFolderLocation()).resolves.toBe("");
    await expect(window.api.security.hasPassword()).resolves.toBe(false);
    await expect(window.api.security.lock()).resolves.toBe(false);
    await expect(window.api.security.setPassword("password")).resolves.toBe(false);
    await expect(window.api.security.unlock("password")).resolves.toEqual({ status: "invalidPassword" });
    await expect(window.api.security.verifyPassword("password")).resolves.toBe(false);
  });

  it("dispatches sort lifecycle events and removes listeners on unsubscribe", async () => {
    const { installBrowserApi } = await import("../../../src/browser/browserApi");
    installBrowserApi();
    const onRequest = vi.fn();
    const onApplied = vi.fn();
    const stopRequest = window.api.noteSort.onSortRequest(onRequest);
    const stopApplied = window.api.noteSort.onSortApplied(onApplied);

    window.api.noteSort.requestSort();
    expect(onRequest).toHaveBeenCalledOnce();
    expect(onApplied).toHaveBeenCalledOnce();

    stopRequest();
    stopApplied();
    window.api.noteSort.requestSort();
    expect(onRequest).toHaveBeenCalledOnce();
    expect(onApplied).toHaveBeenCalledOnce();
  });

  it("reports the current theme and subscribes to system theme changes", async () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const mediaQuery = {
      addEventListener: vi.fn((_event: string, callback: (event: MediaQueryListEvent) => void) => {
        listener = callback;
      }),
      matches: false,
      removeEventListener: vi.fn()
    };
    vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));
    const { installBrowserApi } = await import("../../../src/browser/browserApi");
    installBrowserApi();
    const onThemeChange = vi.fn();

    const unsubscribe = window.api.systemTheme.onThemeChange(onThemeChange);
    listener?.({ matches: true } as MediaQueryListEvent);
    unsubscribe();

    expect(onThemeChange).toHaveBeenNthCalledWith(1, SystemTheme.LIGHT);
    expect(onThemeChange).toHaveBeenNthCalledWith(2, SystemTheme.DARK);
    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith("change", listener);
  });

  it("adds the configured version label and does not replace an existing API", async () => {
    import.meta.env.VITE_APP_VERSION_CONFIG = JSON.stringify({ majorVersion: 1 });
    const { installBrowserApi } = await import("../../../src/browser/browserApi");
    installBrowserApi();

    expect(window.api.version.getShortDisplayVersion()).toBe("Web vtest");
    expect(getShortDisplayVersion).toHaveBeenCalledWith({ majorVersion: 1 });

    const existingApi = window.api;
    installBrowserApi();
    expect(window.api).toBe(existingApi);
  });
});
