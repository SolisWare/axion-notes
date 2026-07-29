/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { channels } from "../ipc/channels";
import { LockState } from "../../src/models/LockState";
import { UnlockResult } from "../../src/models/UnlockResult";
import { off, on, receive } from "./ipcHelpers";

export const securityApi = {

  hasPassword: async (): Promise<boolean> => {
    return receive<boolean>(channels.security.hasPassword);
  },

  getLockState: async (): Promise<LockState> => {
    return receive<LockState>(channels.security.getLockState);
  },

  lock: async (): Promise<boolean> => {
    return receive<boolean>(channels.security.lock);
  },

  unlock: async (password: string): Promise<UnlockResult> => {
    return receive<UnlockResult>(channels.security.unlock, password);
  },

  onLockStateChange: (callback: (lockState: LockState) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, lockState: LockState) => callback(lockState);
    on(channels.security.onLockStateChange, listener);
    return () => off(channels.security.onLockStateChange, listener);
  },

  onSecureLockComplete: (callback: () => void) => {
    const listener = () => callback();
    on(channels.security.onSecureLockComplete, listener);
    return () => off(channels.security.onSecureLockComplete, listener);
  },

  setPassword: async (password: string): Promise<boolean> => {
    return receive<boolean>(channels.security.setPassword, password);
  },

  verifyPassword: async (password: string): Promise<boolean> => {
    return receive<boolean>(channels.security.verifyPassword, password);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
    return receive<boolean>(channels.security.changePassword, currentPassword, newPassword);
  },

  clearPassword: async (): Promise<boolean> => {
    return receive<boolean>(channels.security.clearPassword);
  },

  enableEncryption: async (password: string): Promise<boolean> => {
    return receive<boolean>(channels.security.enableEncryption, password);
  },

  disableEncryption: async (password: string): Promise<boolean> => {
    return receive<boolean>(channels.security.disableEncryption, password);
  }
};
