/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { channels } from "../ipc/channels";
import { NoteLayoutPreference } from "../../src/settings/NoteLayoutPreference";
import { send } from "./ipcHelpers";

export const appWindowApi = {
  close: () => {
    send(channels.appWindow.close);
  },
  readyToShow: () => {
    send(channels.appWindow.readyToShow);
  },
  setAlwaysOnTop: (enabled: boolean) => {
    send(channels.appWindow.setAlwaysOnTop, enabled);
  },
  setLayout: (layout: NoteLayoutPreference) => {
    send(channels.appWindow.setLayout, layout);
  }
};
