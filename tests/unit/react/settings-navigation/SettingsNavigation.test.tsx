/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../src/utils/UserAgent", () => ({
  UserAgent: {
    isElectron: true
  }
}));

import { getSettingsNavigationSections, SettingsView } from "../../../../src/views/SettingsWindow/SettingsNavigation";

describe("Settings navigation", () => {
  it("shows Backups alongside Data & storage in the desktop Storage section", () => {
    const storageSection = getSettingsNavigationSections().find((section) => section.labelKey === "storage");

    expect(storageSection?.items.map((item) => item.id)).toEqual([
      SettingsView.dataStorage,
      SettingsView.backups
    ]);
  });
});
