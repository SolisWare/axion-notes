/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { LockStateService } from "../security/LockStateService";
import { PasswordService } from "../security/PasswordService";
import { channels } from "./channels";

type SecurityIpcOptions = {
  lockStateService: LockStateService;
  passwordService: PasswordService;
};

export function registerSecurityIpc(options: SecurityIpcOptions): void {
  options.lockStateService.onLockStateChange((isLocked) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(channels.security.onLockStateChange, isLocked);
      }
    });
  });

  ipcMain.handle(channels.security.hasPassword, async () => {
    return options.passwordService.hasPassword();
  });

  ipcMain.handle(channels.security.getLockState, () => {
    return options.lockStateService.getIsLocked();
  });

  ipcMain.handle(channels.security.lock, async () => {
    try {
      return await options.lockStateService.lock();
    } catch (err) {
      console.warn("Failed to lock notes:", err);
      return false;
    }
  });

  ipcMain.handle(channels.security.unlock, async (_event, password: string) => {
    try {
      return await options.lockStateService.unlock(password);
    } catch (err) {
      console.warn("Failed to unlock notes:", err);
      return false;
    }
  });

  ipcMain.handle(channels.security.setPassword, async (_event, password: string) => {
    try {
      await options.passwordService.setPassword(password);
      return true;
    } catch (err) {
      console.warn("Failed to set password:", err);
      return false;
    }
  });

  ipcMain.handle(channels.security.verifyPassword, async (_event, password: string) => {
    try {
      return await options.passwordService.verifyPassword(password);
    } catch (err) {
      console.warn("Failed to verify password:", err);
      return false;
    }
  });

  ipcMain.handle(channels.security.changePassword, async (_event, currentPassword: string, newPassword: string) => {
    try {
      const isCurrentPasswordValid = await options.passwordService.verifyPassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return false;
      }

      await options.passwordService.setPassword(newPassword);
      return true;
    } catch (err) {
      console.warn("Failed to change password:", err);
      return false;
    }
  });

  ipcMain.handle(channels.security.clearPassword, async () => {
    try {
      await options.passwordService.clearPassword();
      return true;
    } catch (err) {
      console.warn("Failed to clear password:", err);
      return false;
    }
  });
}
