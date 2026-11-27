/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";

const getShortDisplayVersion = vi.hoisted(() => vi.fn());

vi.mock("../../../../src/utils/app-version/AppVersionResolver", () => ({
  AppVersionResolver: { getShortDisplayVersion }
}));

describe("version preload API", () => {
  it("returns the short display version resolved from the app configuration", async () => {
    getShortDisplayVersion.mockReturnValue("0.5.0");
    const { versionApi } = await import("../../../../electron/preload/versionApi");

    expect(versionApi.getShortDisplayVersion()).toBe("0.5.0");
    expect(getShortDisplayVersion).toHaveBeenCalledOnce();
  });
});
