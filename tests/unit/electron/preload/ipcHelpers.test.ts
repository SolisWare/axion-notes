/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";
import { ipcRenderer } from "electron";
import { off, on, receive, send } from "../../../../electron/preload/ipcHelpers";

vi.mock("electron", () => ({
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
    send: vi.fn()
  }
}));

describe("IPC preload helpers", () => {
  it("delegates sends, invokes, subscriptions, and removals to Electron", async () => {
    const listener = vi.fn();
    vi.mocked(ipcRenderer.invoke).mockResolvedValue("response");

    send("channel", "value");
    await expect(receive("channel", "value")).resolves.toBe("response");
    on("channel", listener);
    off("channel", listener);

    expect(ipcRenderer.send).toHaveBeenCalledWith("channel", "value");
    expect(ipcRenderer.invoke).toHaveBeenCalledWith("channel", "value");
    expect(ipcRenderer.on).toHaveBeenCalledWith("channel", listener);
    expect(ipcRenderer.removeListener).toHaveBeenCalledWith("channel", listener);
  });
});
