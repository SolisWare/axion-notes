/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, Input } from "electron";
import { AppSettings } from "../../src/settings/AppSettings";
import { LockState } from "../../src/models/LockState";
import { LockScreenRequirePasswordDelay } from "../../src/settings/LockScreenRequirePasswordDelay";
import { LockMarkerService } from "./LockMarkerService";
import { PasswordService } from "./PasswordService";

const MAIN_WINDOW_HASH_PREFIX = "#/main";
const LOCK_ROUTE = "/lock";

export type LockStateChangeListener = (lockState: LockState) => void;

/**
 * Owns the in-app lock state for the Electron main process.
 *
 * Renderer code can request lock or unlock, but this service is the authority
 * that decides whether notes are currently locked and forces the main window
 * back to the lock route while locked.
 */
export class LockStateService {
  private isLocked = false;
  private isRecoveryRequired = false;
  private isLockScreenEnabled = false;
  private lastUnlockedMainWindowClosedAt: number | undefined;
  private mainWindow: BrowserWindow | undefined;
  private readonly listeners = new Set<LockStateChangeListener>();

  public constructor(
    private readonly passwordService: PasswordService,
    private readonly lockMarkerService: LockMarkerService
  ) {
  }

  /**
   * Initializes the lock state from persisted settings and password state.
   *
   * @param settings App settings loaded during Electron startup.
   */
  public async initialize(settings: AppSettings): Promise<void> {
    await this.refreshLockState(settings, true);
  }

  /**
   * Refreshes lock state from persisted settings, password, and marker signals.
   *
   * This should run before reconstructing the main window so a long-running
   * Electron process does not reuse stale lock state.
   *
   * @param settings Current app settings.
   * @param forceRequirePassword Whether to require the password without using the close-window grace period.
   */
  public async refreshLockState(settings: AppSettings, forceRequirePassword = false): Promise<void> {
    this.isLockScreenEnabled = settings.lockScreenEnabled;
    const hasPasswordRecord = await this.passwordService.hasPassword();
    const hasUsablePasswordRecord = await this.passwordService.hasUsablePasswordRecord();
    const hasLockMarker = await this.lockMarkerService.hasLockMarker();
    const shouldLock = this.isLockScreenEnabled || hasPasswordRecord || hasLockMarker;
    const isRecoveryRequired = shouldLock && !hasUsablePasswordRecord;

    if (shouldLock && hasUsablePasswordRecord) {
      await this.lockMarkerService.writeLockMarker();
    }

    this.setLockState(
      isRecoveryRequired || (shouldLock && this.shouldRequirePassword(settings.lockScreenRequirePasswordDelay, forceRequirePassword)),
      isRecoveryRequired
    );
  }

  /**
   * Registers the main notes window so locked navigation can be enforced.
   *
   * @param window The Electron main notes window.
   */
  public registerMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    window.webContents.on("before-input-event", (event, input: Input) => {
      if (this.isReloadShortcut(input)) {
        event.preventDefault();
      }
    });

    window.webContents.on("did-navigate-in-page", () => {
      this.forceLockRouteIfNeeded();
    });

    window.webContents.on("did-finish-load", () => {
      this.forceLockRouteIfNeeded();
    });

    window.on("closed", () => {
      if (this.mainWindow === window) {
        if (!this.isLocked) {
          this.lastUnlockedMainWindowClosedAt = Date.now();
        }

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
  }

  /**
   * Returns the current app lock state.
   */
  public getLockState(): LockState {
    return {
      isLocked: this.isLocked,
      isRecoveryRequired: this.isRecoveryRequired
    };
  }

  /**
   * Returns whether the app is currently locked.
   */
  public getIsLocked(): boolean {
    return this.getLockState().isLocked;
  }

  /**
   * Locks the app if the lock screen is enabled and a password exists.
   *
   * @returns true when the app entered locked state; otherwise false.
   */
  public async lock(): Promise<boolean> {
    if (!this.isLockScreenEnabled && !await this.lockMarkerService.hasLockMarker()) {
      return false;
    }

    if (!await this.passwordService.hasUsablePasswordRecord()) {
      this.setLockState(true, true);
      this.forceLockRouteIfNeeded();
      return false;
    }

    await this.lockMarkerService.writeLockMarker();
    this.lastUnlockedMainWindowClosedAt = undefined;
    this.setLockState(true, false);
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
    if (this.isRecoveryRequired) {
      return false;
    }

    const isPasswordValid = await this.passwordService.verifyPassword(password);

    if (!isPasswordValid) {
      return false;
    }

    this.setLockState(false, false);
    return true;
  }

  /**
   * Records that the lock screen has been configured.
   */
  public async markLockConfigured(): Promise<void> {
    await this.lockMarkerService.writeLockMarker();
    this.setLockState(this.isLocked, false);
  }

  /**
   * Clears the redundant lock marker after a verified disable operation.
   */
  public async clearLockConfigured(): Promise<void> {
    await this.lockMarkerService.removeLockMarker();
    this.lastUnlockedMainWindowClosedAt = undefined;
    this.setLockState(false, false);
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

  private setLockState(isLocked: boolean, isRecoveryRequired: boolean): void {
    if (this.isLocked === isLocked && this.isRecoveryRequired === isRecoveryRequired) {
      return;
    }

    this.isLocked = isLocked;
    this.isRecoveryRequired = isRecoveryRequired;
    this.listeners.forEach((listener) => listener(this.getLockState()));
  }

  private shouldRequirePassword(delay: LockScreenRequirePasswordDelay, forceRequirePassword: boolean): boolean {
    if (forceRequirePassword || delay === LockScreenRequirePasswordDelay.IMMEDIATELY || this.lastUnlockedMainWindowClosedAt === undefined) {
      return true;
    }

    return Date.now() - this.lastUnlockedMainWindowClosedAt >= delay * 1000;
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

  private isReloadShortcut(input: Input): boolean {
    if (!this.isLocked) {
      return false;
    }

    return input.key === "F5"
      || ((input.meta || input.control) && input.key.toLowerCase() === "r");
  }
}
