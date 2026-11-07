/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { registerAppWindowIpc } from "./appWindowIpc";
import { registerBackupIpc } from "./backupIpc";
import { applyMenuSettings, registerMenuIpc, setLockScreenActive, setSecureLockAvailable, setStorageMigrationActive } from "./menuIpc";
import { registerNoteSortIpc } from "./noteSortIpc";
import { registerNoteWindowIpc } from "./noteWindowIpc";
import { registerSettingsIpc } from "./settingsIpc";
import { registerSecurityIpc } from "./securityIpc";
import { registerRestoreIpc } from "./restoreIpc";
import { registerStorageIpc } from "./storageIpc";
import { registerSystemThemeIpc } from "./systemThemeIpc";
import { AppSettings } from "../../src/settings/AppSettings";
import { LockStateService } from "../security/LockStateService";
import { PasswordService } from "../security/PasswordService";
import { NoteService } from "../storage/NoteService";
import { BackupService } from "../storage/BackupService";
import { BackupArchiveService } from "../storage/BackupArchiveService";
import { SettingsService } from "../storage/SettingsService";
import { BackupArchiveReader } from "../storage/BackupArchiveReader";
import { RestoreService } from "../storage/RestoreService";
import { RestoreStateStorage } from "../storage/RestoreStateStorage";

type IpcHandlerOptions = {
  appBackupDir: string;
  backupArchiveService: BackupArchiveService;
  backupService: BackupService;
  backupArchiveReader: BackupArchiveReader;
  appDataDir: string;
  appSecurityDir: string;
  mainWindowStateFilePath: string;
  lockStateService: LockStateService;
  noteService: NoteService;
  onSettingsChange?: (settings: AppSettings) => void;
  passwordService: PasswordService;
  restoreService: RestoreService;
  restoreStateStorage: RestoreStateStorage;
  settingsService: SettingsService;
};

export function registerIpcHandlers(options: IpcHandlerOptions): void {
  registerBackupIpc({
    backupArchiveService: options.backupArchiveService,
    backupService: options.backupService,
    lockStateService: options.lockStateService,
    settingsService: options.settingsService
  });
  registerRestoreIpc({
    backupArchiveReader: options.backupArchiveReader,
    lockStateService: options.lockStateService,
    noteService: options.noteService,
    restoreStateStorage: options.restoreStateStorage,
    restoreService: options.restoreService
  });
  registerAppWindowIpc({
    lockStateService: options.lockStateService,
    mainWindowStateFilePath: options.mainWindowStateFilePath,
    settingsService: options.settingsService
  });
  registerSystemThemeIpc();
  registerSecurityIpc({
    appSecurityDir: options.appSecurityDir,
    lockStateService: options.lockStateService,
    noteService: options.noteService,
    passwordService: options.passwordService,
    settingsService: options.settingsService
  });
  options.lockStateService.onLockStateChange((lockState) => {
    setLockScreenActive(lockState.isLocked);
    setSecureLockAvailable(options.noteService.hasPlaintextCache());
  });
  setLockScreenActive(options.lockStateService.getIsLocked());
  setSecureLockAvailable(options.noteService.hasPlaintextCache());
  options.noteService.onPlaintextCacheStateChange(setSecureLockAvailable);
  setStorageMigrationActive(options.noteService.getIsStorageMigrationInProgress());
  options.noteService.onStorageMigrationStateChange(setStorageMigrationActive);
  registerStorageIpc({
    appBackupDir: options.appBackupDir,
    appDataDir: options.appDataDir,
    lockStateService: options.lockStateService,
    noteService: options.noteService
  });
  registerMenuIpc();
  const cachedSettings = options.settingsService.getCachedSettings();
  if (cachedSettings) {
    applyMenuSettings(cachedSettings);
  }
  registerNoteSortIpc({
    lockStateService: options.lockStateService
  });
  registerNoteWindowIpc({
    lockStateService: options.lockStateService
  });
  registerSettingsIpc({
    lockStateService: options.lockStateService,
    onSettingsChange: (settings: AppSettings) => {
      options.lockStateService.applySettings(settings);
      applyMenuSettings(settings);
      options.onSettingsChange?.(settings);
    },
    settingsService: options.settingsService
  });
}
