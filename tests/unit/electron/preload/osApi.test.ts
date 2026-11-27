/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../electron/utils/Platform", () => ({
  isMac: true,
  isWindows: false
}));

describe("OS preload API", () => {
  it("exposes the platform flags supplied by the main-process platform utility", async () => {
    const { osApi } = await import("../../../../electron/preload/osApi");

    expect(osApi).toEqual({ isMac: true, isWindows: false });
  });
});
