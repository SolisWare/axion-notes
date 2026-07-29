/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { registerAppWindowIpc } from "./appWindowIpc";
import { applyMenuSettings, registerMenuIpc, setLockScreenActive } from "./menuIpc";
import { registerNoteSortIpc } from "./noteSortIpc";
import { registerNoteWindowIpc } from "./noteWindowIpc";
import { registerSettingsIpc } from "./settingsIpc";
import { registerSecurityIpc } from "./securityIpc";
import { registerStorageIpc } from "./storageIpc";
import { registerSystemThemeIpc } from "./systemThemeIpc";
import { AppSettings } from "../../src/settings/AppSettings";
import { LockStateService } from "../security/LockStateService";
import { PasswordService } from "../security/PasswordService";
import { NoteService } from "../storage/NoteService";
import { SettingsService } from "../storage/SettingsService";

type IpcHandlerOptions = {
  appDataDir: string;
  mainWindowStateFilePath: string;
  lockStateService: LockStateService;
  noteService: NoteService;
  onSettingsChange?: (settings: AppSettings) => void;
  passwordService: PasswordService;
  settingsService: SettingsService;
};

export function registerIpcHandlers(options: IpcHandlerOptions): void {
  registerAppWindowIpc({
    lockStateService: options.lockStateService,
    mainWindowStateFilePath: options.mainWindowStateFilePath
  });
  registerSystemThemeIpc();
  registerSecurityIpc({
    lockStateService: options.lockStateService,
    noteService: options.noteService,
    passwordService: options.passwordService,
    settingsService: options.settingsService
  });
  options.lockStateService.onLockStateChange((lockState) => setLockScreenActive(lockState.isLocked));
  setLockScreenActive(options.lockStateService.getIsLocked());
  registerStorageIpc({
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
