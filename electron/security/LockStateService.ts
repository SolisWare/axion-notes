/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, Input, powerMonitor } from "electron";
import { AppSettings } from "../../src/settings/AppSettings";
import { LockState } from "../../src/models/LockState";
import { UnlockResult } from "../../src/models/UnlockResult";
import { UnlockResultStatus } from "../../src/models/UnlockResultStatus";
import { LockScreenIdleTimeout } from "../../src/settings/LockScreenIdleTimeout";
import { LockScreenRequirePasswordDelay } from "../../src/settings/LockScreenRequirePasswordDelay";
import { BruteForceProtectionService } from "./BruteForceProtectionService";
import { LockMarkerService } from "./LockMarkerService";
import { PasswordService } from "./PasswordService";
import { NoteService } from "../storage/NoteService";

const MAIN_WINDOW_HASH_PREFIX = "#/main";
const LOCK_ROUTE = "/lock";
const IDLE_LOCK_CHECK_INTERVAL_MS = 10 * 1000;
const FLUSH_ACTIVE_EDITOR_SCRIPT = `
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
`;
const PREPARE_LOCK_TRANSITION_SCRIPT = `
  window.dispatchEvent(new Event("axion-notes:prepare-lock"));
`;

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
  private isBruteForceProtectionEnabled = true;
  private isNotesEncryptionEnabled = false;
  private isLockScreenEnabled = false;
  private isLocking = false;
  private isLockOnSystemSleepEnabled = true;
  private lockScreenIdleTimeout = LockScreenIdleTimeout.TEN_MINUTES;
  private idleLockInterval: NodeJS.Timeout | undefined;
  private lastUnlockedMainWindowClosedAt: number | undefined;
  private mainWindow: BrowserWindow | undefined;
  private readonly listeners = new Set<LockStateChangeListener>();

  public constructor(
    private readonly passwordService: PasswordService,
    private readonly bruteForceProtectionService: BruteForceProtectionService,
    private readonly lockMarkerService: LockMarkerService,
    private readonly noteService: NoteService
  ) {
  }

  /**
   * Initializes the lock state from persisted settings and password state.
   *
   * @param settings App settings loaded during Electron startup.
   */
  public async initialize(settings: AppSettings): Promise<void> {
    this.registerPowerMonitorHandlers();
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
    this.isNotesEncryptionEnabled = settings.notesEncryptionEnabled;
    this.isBruteForceProtectionEnabled = settings.bruteForceProtectionEnabled;
    this.isLockOnSystemSleepEnabled = settings.lockScreenOnSystemSleepEnabled;
    this.lockScreenIdleTimeout = settings.lockScreenIdleTimeout;
    this.noteService.applyEncryptionSetting(settings.notesEncryptionEnabled);
    await this.bruteForceProtectionService.initialize();
    this.noteService.applyEncryptionSetting(settings.notesEncryptionEnabled);
    const hasPasswordRecord = await this.passwordService.hasPassword();
    const hasEncryptionRecord = await this.noteService.hasEncryptionRecord();
    const hasUsablePasswordRecord = this.isNotesEncryptionEnabled
      ? hasEncryptionRecord
      : await this.passwordService.hasUsablePasswordRecord();
    const hasLockMarker = await this.lockMarkerService.hasLockMarker();
    const shouldLock = this.isLockScreenEnabled || this.isNotesEncryptionEnabled || hasPasswordRecord || hasLockMarker;
    const isRecoveryRequired = shouldLock && !hasUsablePasswordRecord;

    if (shouldLock && hasUsablePasswordRecord) {
      await this.lockMarkerService.writeLockMarker();
    }

    this.setLockState(
      isRecoveryRequired || (shouldLock && this.shouldRequirePassword(settings.lockScreenRequirePasswordDelay, forceRequirePassword)),
      isRecoveryRequired
    );
    this.updateIdleLockTimer();
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

    this.applyMainWindowContentProtection();
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
    this.isNotesEncryptionEnabled = settings.notesEncryptionEnabled;
    this.isBruteForceProtectionEnabled = settings.bruteForceProtectionEnabled;
    this.isLockOnSystemSleepEnabled = settings.lockScreenOnSystemSleepEnabled;
    this.lockScreenIdleTimeout = settings.lockScreenIdleTimeout;

    if (!settings.bruteForceProtectionEnabled) {
      void this.bruteForceProtectionService.reset();
    }

    this.updateIdleLockTimer();
  }

  /**
   * Returns the current app lock state.
   */
  public getLockState(): LockState {
    const bruteForceProtectionStatus = this.bruteForceProtectionService.getStatus();

    return {
      isLocked: this.isLocked,
      isRecoveryRequired: this.isRecoveryRequired,
      unlockCooldownUntil: this.isBruteForceProtectionEnabled
        ? bruteForceProtectionStatus.cooldownUntil
        : undefined
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
    if (this.isLocking) {
      return false;
    }

    if (!this.isLockScreenEnabled && !this.isNotesEncryptionEnabled && !await this.lockMarkerService.hasLockMarker()) {
      return false;
    }

    this.isLocking = true;

    try {
      await this.flushActiveEditorBeforeLock();
      await this.prepareMainWindowForLock();

      const hasUsablePasswordRecord = this.isNotesEncryptionEnabled
        ? await this.noteService.hasEncryptionRecord()
        : await this.passwordService.hasUsablePasswordRecord();

      if (!hasUsablePasswordRecord) {
        this.setLockState(true, true);
        this.forceLockRouteIfNeeded();
        return false;
      }

      await this.lockMarkerService.writeLockMarker();
      this.lastUnlockedMainWindowClosedAt = undefined;
      this.setLockState(true, false);
      this.forceLockRouteIfNeeded();
      return true;
    } finally {
      this.isLocking = false;
    }
  }

  /**
   * Locks the app and clears decrypted note/key material from memory.
   */
  public async secureLock(): Promise<boolean> {
    if (!this.isNotesEncryptionEnabled) {
      return false;
    }

    if (!this.noteService.hasPlaintextCache()) {
      return false;
    }

    if (this.isLocked) {
      this.noteService.clearPlaintextCache();
      return true;
    }

    const didLock = await this.lock();

    if (didLock) {
      this.noteService.clearPlaintextCache();
    }

    return didLock;
  }

  /**
   * Verifies the password and unlocks the app when it is correct.
   *
   * @param password Raw password entered by the user.
   * @returns Unlock result status for the renderer.
   */
  public async unlock(password: string): Promise<UnlockResult> {
    if (this.isRecoveryRequired) {
      return {
        status: UnlockResultStatus.RECOVERY_REQUIRED
      };
    }

    if (this.isBruteForceProtectionEnabled) {
      const bruteForceProtectionStatus = this.bruteForceProtectionService.getStatus();

      if (bruteForceProtectionStatus.isCooldownActive) {
        return {
          status: UnlockResultStatus.COOLDOWN_ACTIVE,
          cooldownUntil: bruteForceProtectionStatus.cooldownUntil
        };
      }
    }

    const isPasswordValid = await this.verifyUnlockPassword(password);

    if (!isPasswordValid) {
      if (this.isBruteForceProtectionEnabled) {
        const bruteForceProtectionStatus = await this.bruteForceProtectionService.recordFailedAttempt();

        if (bruteForceProtectionStatus.isCooldownActive) {
          return {
            status: UnlockResultStatus.COOLDOWN_ACTIVE,
            cooldownUntil: bruteForceProtectionStatus.cooldownUntil
          };
        }
      }

      return {
        status: UnlockResultStatus.INVALID_PASSWORD
      };
    }

    await this.bruteForceProtectionService.reset();
    this.setLockState(false, false);
    return {
      status: UnlockResultStatus.UNLOCKED
    };
  }

  private async verifyUnlockPassword(password: string): Promise<boolean> {
    if (!this.isNotesEncryptionEnabled) {
      return this.passwordService.verifyPassword(password);
    }

    try {
      await this.noteService.unlockEncryption(password);
      return true;
    } catch (err) {
      console.warn("Failed to unlock encrypted notes:", err);
      return false;
    }
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
    this.applyMainWindowContentProtection();
    this.listeners.forEach((listener) => listener(this.getLockState()));
  }

  private shouldRequirePassword(delay: LockScreenRequirePasswordDelay, forceRequirePassword: boolean): boolean {
    if (forceRequirePassword || delay === LockScreenRequirePasswordDelay.IMMEDIATELY || this.lastUnlockedMainWindowClosedAt === undefined) {
      return true;
    }

    return Date.now() - this.lastUnlockedMainWindowClosedAt >= delay * 1000;
  }

  private registerPowerMonitorHandlers(): void {
    const lockOnPowerEvent = () => {
      if (!this.isLockOnSystemSleepEnabled || !this.isLockScreenEnabled || this.isLocked) {
        return;
      }

      void this.lock();
    };

    powerMonitor.on("lock-screen", lockOnPowerEvent);
    powerMonitor.on("suspend", lockOnPowerEvent);
  }

  private updateIdleLockTimer(): void {
    if (this.idleLockInterval) {
      clearInterval(this.idleLockInterval);
      this.idleLockInterval = undefined;
    }

    if (!this.isLockScreenEnabled || this.lockScreenIdleTimeout === LockScreenIdleTimeout.NEVER) {
      return;
    }

    this.idleLockInterval = setInterval(() => {
      this.lockIfIdle();
    }, IDLE_LOCK_CHECK_INTERVAL_MS);
  }

  private lockIfIdle(): void {
    if (!this.isLockScreenEnabled || this.isLocked || this.isLocking) {
      return;
    }

    const idleTimeSeconds = powerMonitor.getSystemIdleTime();
    const idleTimeoutSeconds = this.lockScreenIdleTimeout * 60;

    if (idleTimeSeconds < idleTimeoutSeconds) {
      return;
    }

    void this.lock();
  }

  private async flushActiveEditorBeforeLock(): Promise<void> {
    if (!this.mainWindow || this.mainWindow.isDestroyed() || this.mainWindow.webContents.isDestroyed()) {
      return;
    }

    try {
      await this.mainWindow.webContents.executeJavaScript(FLUSH_ACTIVE_EDITOR_SCRIPT, true);
    } catch (err) {
      console.warn("Failed to flush active editor before locking:", err);
    }
  }

  private async prepareMainWindowForLock(): Promise<void> {
    if (!this.mainWindow || this.mainWindow.isDestroyed() || this.mainWindow.webContents.isDestroyed()) {
      return;
    }

    try {
      await this.mainWindow.webContents.executeJavaScript(PREPARE_LOCK_TRANSITION_SCRIPT, true);
    } catch (err) {
      console.warn("Failed to prepare main window for locking:", err);
    }
  }

  private applyMainWindowContentProtection(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    try {
      this.mainWindow.setContentProtection(this.isLocked);
    } catch (err) {
      console.warn("Failed to update main window content protection:", err);
    }
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
