/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { channels } from "../ipc/channels";
import { off, on, send } from "./ipcHelpers";

export const noteSortApi = {

  requestSort: () => {
    send(channels.noteSort.requestSort);
  },

  onSortRequest: (callback: () => void) => {
    const listener = () => callback();
    on(channels.noteSort.onSortRequest, listener);
    return () => off(channels.noteSort.onSortRequest, listener);
  }
};
