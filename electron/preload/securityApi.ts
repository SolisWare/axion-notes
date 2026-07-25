/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { channels } from "../ipc/channels";
import { receive } from "./ipcHelpers";

export const securityApi = {

  hasPassword: async (): Promise<boolean> => {
    return receive<boolean>(channels.security.hasPassword);
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
  }
};
