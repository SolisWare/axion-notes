/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";
import { contextBridge } from "electron";

vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn()
  }
}));

describe("preload entry point", () => {
  it("exposes every supported API through the isolated renderer bridge", async () => {
    await import("../../../../electron/preload/preload");

    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith("api", expect.objectContaining({
      appWindow: expect.any(Object),
      backup: expect.any(Object),
      clipboard: expect.any(Object),
      menu: expect.any(Object),
      noteSort: expect.any(Object),
      noteWindow: expect.any(Object),
      os: expect.any(Object),
      restore: expect.any(Object),
      security: expect.any(Object),
      settings: expect.any(Object),
      storage: expect.any(Object),
      systemTheme: expect.any(Object),
      version: expect.any(Object)
    }));
  });
});
