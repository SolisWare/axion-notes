/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";
import { app } from "electron";
import { registerClipboardPrivacyShutdown } from "../../../../electron/security/clipboardPrivacyShutdown";

vi.mock("electron", () => ({
  app: {
    on: vi.fn()
  }
}));

describe("clipboard privacy shutdown", () => {
  it("clears a pending Axion Notes clipboard copy when Electron will quit", () => {
    const clipboardPrivacyService = {
      clearTrackedNoteCopy: vi.fn()
    };

    registerClipboardPrivacyShutdown(clipboardPrivacyService as never);

    expect(app.on).toHaveBeenCalledWith("will-quit", expect.any(Function));
    const handler = vi.mocked(app.on).mock.calls[0][1] as () => void;
    handler();

    expect(clipboardPrivacyService.clearTrackedNoteCopy).toHaveBeenCalledOnce();
  });
});
