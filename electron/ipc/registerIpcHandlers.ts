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

type IpcHandlerOptions = {
  appDataDir: string;
  appSettingsFilePath: string;
  mainWindowStateFilePath: string;
  initialSettings?: AppSettings;
  lockStateService: LockStateService;
  onSettingsChange?: (settings: AppSettings) => void;
  passwordService: PasswordService;
};

export function registerIpcHandlers(options: IpcHandlerOptions): void {
  registerAppWindowIpc({
    mainWindowStateFilePath: options.mainWindowStateFilePath
  });
  registerSystemThemeIpc();
  registerSecurityIpc({
    lockStateService: options.lockStateService,
    passwordService: options.passwordService
  });
  options.lockStateService.onLockStateChange((lockState) => setLockScreenActive(lockState.isLocked));
  setLockScreenActive(options.lockStateService.getIsLocked());
  registerStorageIpc({ appDataDir: options.appDataDir });
  registerMenuIpc();
  if (options.initialSettings) {
    applyMenuSettings(options.initialSettings);
  }
  registerNoteSortIpc();
  registerNoteWindowIpc();
  registerSettingsIpc({
    appSettingsFilePath: options.appSettingsFilePath,
    initialSettings: options.initialSettings,
    onSettingsChange: (settings: AppSettings) => {
      options.lockStateService.applySettings(settings);
      applyMenuSettings(settings);
      options.onSettingsChange?.(settings);
    }
  });
}
