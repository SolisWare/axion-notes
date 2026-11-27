/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { clipboardApi } from "../../../../electron/preload/clipboardApi";
import { send } from "../../../../electron/preload/ipcHelpers";

vi.mock("../../../../electron/preload/ipcHelpers", () => ({
  send: vi.fn()
}));

describe("clipboard API", () => {
  it("sends the note-copy tracking request to the main process", () => {
    clipboardApi.trackNoteCopy();

    expect(send).toHaveBeenCalledWith(channels.clipboard.trackNoteCopy);
  });
});
