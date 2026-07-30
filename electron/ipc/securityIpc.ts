/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, ipcMain } from "electron";
import { EncryptionProgressEvent } from "../../src/models/EncryptionProgressEvent";
import { UnlockResult } from "../../src/models/UnlockResult";
import { UnlockResultStatus } from "../../src/models/UnlockResultStatus";
import { LockStateService } from "../security/LockStateService";
import { PasswordService } from "../security/PasswordService";
import { NoteService } from "../storage/NoteService";
import { SettingsService } from "../storage/SettingsService";
import { channels } from "./channels";
import { protectedHandle } from "./protectedIpc";

type SecurityIpcOptions = {
  appSecurityDir: string;
  lockStateService: LockStateService;
  noteService: NoteService;
  passwordService: PasswordService;
  settingsService: SettingsService;
};

export function registerSecurityIpc(options: SecurityIpcOptions): void {
  function sendEncryptionProgress(event: Electron.IpcMainInvokeEvent, progress: EncryptionProgressEvent): void {
    if (!event.sender.isDestroyed()) {
      event.sender.send(channels.security.onEncryptionProgress, progress);
    }
  }

  options.lockStateService.onLockStateChange((lockState) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.webContents.isDestroyed()) {
        window.webContents.send(channels.security.onLockStateChange, lockState);
      }
    });
  });

  ipcMain.handle(channels.security.hasPassword, async () => {
    return await options.passwordService.hasPassword() || await options.noteService.hasEncryptionRecord();
  });

  ipcMain.handle(channels.security.getLockState, () => {
    return options.lockStateService.getLockState();
  });

  protectedHandle<string, []>(channels.security.getSecurityFolderLocation, { ...options, fallback: "" }, () => {
    return options.appSecurityDir;
  });

  ipcMain.handle(channels.security.lock, async () => {
    try {
      return await options.lockStateService.lock();
    } catch (err) {
      console.warn("Failed to lock notes:", err);
      return false;
    }
  });

  ipcMain.handle(channels.security.unlock, async (_event, password: string): Promise<UnlockResult> => {
    try {
      return await options.lockStateService.unlock(password);
    } catch (err) {
      console.warn("Failed to unlock notes:", err);
      return {
        status: UnlockResultStatus.INVALID_PASSWORD
      };
    }
  });

  protectedHandle<boolean, [string]>(channels.security.setPassword, { ...options, fallback: false }, async (_event, password) => {
    try {
      await options.passwordService.setPassword(password);
      await options.lockStateService.markLockConfigured();
      return true;
    } catch (err) {
      console.warn("Failed to set password:", err);
      return false;
    }
  });

  protectedHandle<boolean, [string]>(channels.security.verifyPassword, { ...options, fallback: false }, async (_event, password) => {
    try {
      return await options.passwordService.verifyPassword(password);
    } catch (err) {
      console.warn("Failed to verify password:", err);
      return false;
    }
  });

  protectedHandle<boolean, [string, string]>(channels.security.changePassword, { ...options, fallback: false }, async (_event, currentPassword, newPassword) => {
    try {
      const settings = await options.settingsService.getSettings();
      const isEncryptionEnabled = settings?.notesEncryptionEnabled === true;
      const isCurrentPasswordValid = isEncryptionEnabled
        ? await options.noteService.verifyEncryptionPassword(currentPassword)
        : await options.passwordService.verifyPassword(currentPassword);

      if (!isCurrentPasswordValid) {
        return false;
      }

      if (isEncryptionEnabled) {
        await options.noteService.changeEncryptionPassword(currentPassword, newPassword);
      } else {
        await options.passwordService.setPassword(newPassword);
      }

      await options.lockStateService.markLockConfigured();
      return true;
    } catch (err) {
      console.warn("Failed to change password:", err);
      return false;
    }
  });

  protectedHandle<boolean, []>(channels.security.clearPassword, { ...options, fallback: false }, async () => {
    try {
      await options.passwordService.clearPassword();
      await options.lockStateService.clearLockConfigured();
      return true;
    } catch (err) {
      console.warn("Failed to clear password:", err);
      return false;
    }
  });

  protectedHandle<boolean, [string]>(channels.security.enableEncryption, { ...options, fallback: false }, async (event, password) => {
    try {
      const isPasswordValid = await options.passwordService.verifyPassword(password);

      if (!isPasswordValid) {
        return false;
      }

      await options.noteService.enableEncryption(password, (progress) => sendEncryptionProgress(event, progress));
      await options.passwordService.clearPassword();
      await options.lockStateService.markLockConfigured();
      return true;
    } catch (err) {
      console.warn("Failed to enable note encryption:", err);
      return false;
    }
  });

  protectedHandle<boolean, [string]>(channels.security.disableEncryption, { ...options, fallback: false }, async (event, password) => {
    try {
      await options.noteService.disableEncryption(password, (progress) => sendEncryptionProgress(event, progress));
      await options.passwordService.setPassword(password);
      await options.lockStateService.markLockConfigured();
      return true;
    } catch (err) {
      console.warn("Failed to disable note encryption:", err);
      return false;
    }
  });
}
