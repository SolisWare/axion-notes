/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { channels } from "../ipc/channels";
import { send } from "./ipcHelpers";

export const noteWindowApi = {
  open: (noteId: string) => {
    send(channels.noteWindow.open, noteId);
  }
};
