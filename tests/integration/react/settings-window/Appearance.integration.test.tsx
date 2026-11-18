/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsWindow from "../../../../src/views/SettingsWindow/SettingsWindow";
import { AppSettings } from "../../../../src/settings/AppSettings";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { UserAgent } from "../../../../src/utils/UserAgent";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  about: "About",
  appearance: "Appearance",
  applicationTheme: "Application theme",
  backups: "Backups",
  dataStorage: "Data & storage",
  editor: "Editor",
  general: "General",
  info: "Info",
  license: "License",
  links: "Links",
  newNoteDefaultColor: "New note default color",
  "noteColors.auto": "Auto",
  "noteColors.green": "Green",
  "noteColors.indigo": "Indigo",
  "noteColors.lilac": "Lilac",
  "noteColors.red": "Red",
  "noteColors.teal": "Teal",
  "noteColors.yellow": "Yellow",
  noteSize: "Note size",
  "noteSizeOptions.compact": "Compact",
  "noteSizeOptions.default": "Default",
  "noteSizeOptions.large": "Large",
  "noteSizeOptions.wide": "Wide",
  preferences: "Preferences",
  richTextEditorRequired: "The rich text editor is required",
  showFloatingFormatToolbar: "Show floating formatting toolbar",
  showFloatingFormatToolbarHelp: "Show text formatting controls near selected content",
  showNoteFooters: "Show note footers",
  showNoteFootersHelp: "Show the note modified date and time",
  showTitles: "Show titles",
  showTitlesHelp: "Show a title section on every note",
  storage: "Storage",
  "themeOptions.auto": "Auto",
  "themeOptions.dark": "Dark",
  "themeOptions.light": "Light"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string) => translations[key] ?? key
  })
}));

describe("SettingsWindow Appearance integration", () => {
  afterEach(() => {
    UserAgent.isElectron = false;
  });

  it("routes to Appearance and retains selected preferences through SettingsWindow state", async () => {
    const user = userEvent.setup();
    UserAgent.isElectron = false;
    installDesktopApiMock();

    render(<StatefulSettingsWindow />);

    await user.click(screen.getByRole("button", { name: "Appearance" }));
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    fireEvent.click(screen.getByRole("radio", { name: "Green" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Show titles" }));

    expect(screen.getByRole("heading", { name: "Appearance" })).toBeVisible();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Green" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Show titles" })).not.toBeChecked();
  });
});

function StatefulSettingsWindow() {
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);

  return <SettingsWindow appSettings={appSettings} onAppSettingsChange={setAppSettings} theme={SystemTheme.LIGHT} />;
}
