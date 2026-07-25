/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ipcMain } from "electron";
import { PasswordService } from "../security/PasswordService";
import { channels } from "./channels";

type SecurityIpcOptions = {
  passwordRecordPath: string;
};

export function registerSecurityIpc(options: SecurityIpcOptions): void {
  const passwordService = new PasswordService(options.passwordRecordPath);

  ipcMain.handle(channels.security.hasPassword, async () => {
    return passwordService.hasPassword();
  });

  ipcMain.handle(channels.security.setPassword, async (_event, password: string) => {
    try {
      await passwordService.setPassword(password);
      return true;
    } catch (err) {
      console.warn("Failed to set password:", err);
      return false;
    }
  });

  ipcMain.handle(channels.security.verifyPassword, async (_event, password: string) => {
    try {
      return await passwordService.verifyPassword(password);
    } catch (err) {
      console.warn("Failed to verify password:", err);
      return false;
    }
  });

  ipcMain.handle(channels.security.changePassword, async (_event, currentPassword: string, newPassword: string) => {
    try {
      const isCurrentPasswordValid = await passwordService.verifyPassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return false;
      }

      await passwordService.setPassword(newPassword);
      return true;
    } catch (err) {
      console.warn("Failed to change password:", err);
      return false;
    }
  });

  ipcMain.handle(channels.security.clearPassword, async () => {
    try {
      await passwordService.clearPassword();
      return true;
    } catch (err) {
      console.warn("Failed to clear password:", err);
      return false;
    }
  });
}
