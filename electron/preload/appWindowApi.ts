/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { channels } from "../ipc/channels";
import { send } from "./ipcHelpers";

export const appWindowApi = {
  setAlwaysOnTop: (enabled: boolean) => {
    send(channels.appWindow.setAlwaysOnTop, enabled);
  }
};
