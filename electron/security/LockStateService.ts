/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow } from "electron";
import { AppSettings } from "../../src/settings/AppSettings";
import { PasswordService } from "./PasswordService";

const MAIN_WINDOW_HASH_PREFIX = "#/main";
const LOCK_ROUTE = "/lock";

export type LockStateChangeListener = (isLocked: boolean) => void;

/**
 * Owns the in-app lock state for the Electron main process.
 *
 * Renderer code can request lock or unlock, but this service is the authority
 * that decides whether notes are currently locked and forces the main window
 * back to the lock route while locked.
 */
export class LockStateService {
  private isLocked = false;
  private isLockScreenEnabled = false;
  private mainWindow: BrowserWindow | undefined;
  private readonly listeners = new Set<LockStateChangeListener>();

  public constructor(private readonly passwordService: PasswordService) {
  }

  /**
   * Initializes the lock state from persisted settings and password state.
   *
   * @param settings App settings loaded during Electron startup.
   */
  public async initialize(settings: AppSettings): Promise<void> {
    this.isLockScreenEnabled = settings.lockScreenEnabled;
    this.isLocked = this.isLockScreenEnabled && await this.passwordService.hasPassword();
  }

  /**
   * Registers the main notes window so locked navigation can be enforced.
   *
   * @param window The Electron main notes window.
   */
  public registerMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    window.webContents.on("did-navigate-in-page", () => {
      this.forceLockRouteIfNeeded();
    });

    window.webContents.on("did-finish-load", () => {
      this.forceLockRouteIfNeeded();
    });

    window.on("closed", () => {
      if (this.mainWindow === window) {
        this.mainWindow = undefined;
      }
    });

    this.forceLockRouteIfNeeded();
  }

  /**
   * Applies updated settings that affect the lock state.
   *
   * Disabling the lock screen immediately clears the active locked state.
   *
   * @param settings Updated app settings.
   */
  public applySettings(settings: AppSettings): void {
    this.isLockScreenEnabled = settings.lockScreenEnabled;

    if (!this.isLockScreenEnabled && this.isLocked) {
      this.setLocked(false);
    }
  }

  /**
   * Returns whether the app is currently locked.
   */
  public getIsLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Locks the app if the lock screen is enabled and a password exists.
   *
   * @returns true when the app entered locked state; otherwise false.
   */
  public async lock(): Promise<boolean> {
    if (!this.isLockScreenEnabled || !await this.passwordService.hasPassword()) {
      return false;
    }

    this.setLocked(true);
    this.forceLockRouteIfNeeded();
    return true;
  }

  /**
   * Verifies the password and unlocks the app when it is correct.
   *
   * @param password Raw password entered by the user.
   * @returns true when the app was unlocked; otherwise false.
   */
  public async unlock(password: string): Promise<boolean> {
    const isPasswordValid = await this.passwordService.verifyPassword(password);

    if (!isPasswordValid) {
      return false;
    }

    this.setLocked(false);
    return true;
  }

  /**
   * Subscribes to lock state changes.
   *
   * @param listener Listener called with the latest lock state.
   * @returns Unsubscribe function.
   */
  public onLockStateChange(listener: LockStateChangeListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private setLocked(isLocked: boolean): void {
    if (this.isLocked === isLocked) {
      return;
    }

    this.isLocked = isLocked;
    this.listeners.forEach((listener) => listener(this.isLocked));
  }

  private forceLockRouteIfNeeded(): void {
    if (!this.isLocked || !this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const currentUrl = this.mainWindow.webContents.getURL();

    if (this.isLockRoute(currentUrl)) {
      return;
    }

    this.mainWindow.webContents.executeJavaScript(
      `window.location.hash = "${MAIN_WINDOW_HASH_PREFIX}${LOCK_ROUTE}";`,
      true
    ).catch((err) => {
      console.warn("Failed to force lock route:", err);
    });
  }

  private isLockRoute(url: string): boolean {
    try {
      return new URL(url).hash === `${MAIN_WINDOW_HASH_PREFIX}${LOCK_ROUTE}`;
    } catch {
      return false;
    }
  }
}
