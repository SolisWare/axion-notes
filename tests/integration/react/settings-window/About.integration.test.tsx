/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsWindow from "../../../../src/views/SettingsWindow/SettingsWindow";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { UserAgent } from "../../../../src/utils/UserAgent";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  about: "About",
  appearance: "Appearance",
  backups: "Backups",
  dataStorage: "Data & storage",
  editor: "Editor",
  general: "General",
  info: "Info",
  license: "License",
  links: "Links",
  preferences: "Preferences",
  rightsReserved: "All rights reserved.",
  storage: "Storage",
  version: "Version {{version}}"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, string>) => key === "version"
      ? `Version ${values?.version}`
      : translations[key] ?? key
  })
}));

describe("SettingsWindow About integration", () => {
  afterEach(() => {
    UserAgent.isElectron = false;
  });

  it("opens About from Settings navigation and renders its browser version details", async () => {
    const user = userEvent.setup();
    UserAgent.isElectron = false;
    installDesktopApiMock({
      version: { getShortDisplayVersion: vi.fn(() => "v9.8.7") }
    });

    render(
      <SettingsWindow
        appSettings={defaultAppSettings}
        onAppSettingsChange={vi.fn()}
        theme={SystemTheme.LIGHT}
      />
    );

    await user.click(screen.getByRole("button", { name: "About" }));

    expect(screen.getByRole("heading", { name: "About" })).toBeVisible();
    expect(screen.getByText("Version 9.8.7")).toBeVisible();
    expect(screen.getByText(`Copyright © 2023-${new Date().getFullYear()} SolisWare.`)).toBeVisible();
    expect(screen.getByText("All rights reserved.")).toBeVisible();
  });
});
