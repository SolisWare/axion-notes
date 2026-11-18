/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import Appearance from "../../../../src/views/SettingsWindow/pages/Appearance";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { AppThemePreference } from "../../../../src/settings/AppThemePreference";
import { NoteColorPreference } from "../../../../src/settings/noteColorPreference";
import { NoteSizePreference } from "../../../../src/settings/noteSizePreference";
import { NoteColorKey } from "../../../../src/theme/NoteColors";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const translations: Record<string, string> = {
  applicationTheme: "Application theme",
  newNoteDefaultColor: "New note default color",
  noteSize: "Note size",
  "noteColors.auto": "Auto",
  "noteColors.green": "Green",
  "noteColors.indigo": "Indigo",
  "noteColors.lilac": "Lilac",
  "noteColors.red": "Red",
  "noteColors.teal": "Teal",
  "noteColors.yellow": "Yellow",
  "noteSizeOptions.compact": "Compact",
  "noteSizeOptions.default": "Default",
  "noteSizeOptions.large": "Large",
  "noteSizeOptions.wide": "Wide",
  richTextEditorRequired: "The rich text editor is required",
  showFloatingFormatToolbar: "Show floating formatting toolbar",
  showFloatingFormatToolbarHelp: "Show text formatting controls near selected content",
  showNoteFooters: "Show note footers",
  showNoteFootersHelp: "Show the note modified date and time",
  showTitles: "Show titles",
  showTitlesHelp: "Show a title section on every note",
  "themeOptions.auto": "Auto",
  "themeOptions.dark": "Dark",
  "themeOptions.light": "Light"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key
  })
}));

describe("Appearance", () => {
  it.each([SystemTheme.LIGHT, SystemTheme.DARK])("renders accessible appearance controls with the %s theme", (theme) => {
    renderAppearance({ theme });

    const themeGroup = screen.getByRole("group", { name: "Application theme" });
    const colorGroup = screen.getByRole("group", { name: "New note default color" });
    expect(themeGroup).toBeInTheDocument();
    expect(within(themeGroup).getByRole("radio", { name: "Auto" })).toBeChecked();
    expect(colorGroup).toBeInTheDocument();
    expect(within(colorGroup).getByRole("radio", { name: "Auto" })).toBeInTheDocument();
    expect(within(colorGroup).getByRole("radio", { name: "Yellow" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Note size" })).toHaveValue(NoteSizePreference.DEFAULT);
    expect(screen.getByRole("checkbox", { name: "Show titles" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Show note footers" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Show floating formatting toolbar" })).toBeChecked();
  });

  it("applies theme, note color, size, and visibility changes without discarding other settings", () => {
    const onAppSettingsChange = vi.fn();
    renderAppearance({ onAppSettingsChange });

    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    fireEvent.click(screen.getByRole("radio", { name: "Green" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Note size" }), { target: { value: NoteSizePreference.LARGE } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Show titles" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Show note footers" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Show floating formatting toolbar" }));

    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, theme: AppThemePreference.DARK });
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, defaultNoteColor: NoteColorKey.GREEN });
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, noteSize: NoteSizePreference.LARGE });
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, showTitles: false });
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, showNoteFooters: false });
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, showFloatingFormatToolbar: false });
  });

  it("shows the selected default note-color radio state", () => {
    renderAppearance({
      appSettings: { ...defaultAppSettings, defaultNoteColor: NoteColorPreference.AUTO }
    });
    expect(within(screen.getByRole("group", { name: "New note default color" })).getByRole("radio", { name: "Auto" })).toBeChecked();

    renderAppearance({
      appSettings: { ...defaultAppSettings, defaultNoteColor: NoteColorKey.LILAC }
    });
    expect(within(screen.getAllByRole("group", { name: "New note default color" }).at(-1)!).getByRole("radio", { name: "Lilac" })).toBeChecked();
  });

  it("disables the floating toolbar preference when rich text editing is disabled", () => {
    renderAppearance({
      appSettings: {
        ...defaultAppSettings,
        richTextEditorEnabled: false,
        showFloatingFormatToolbar: true
      }
    });

    expect(screen.getByRole("checkbox", { name: "Show floating formatting toolbar" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Show floating formatting toolbar" })).not.toBeChecked();
  });
});

function renderAppearance(overrides: Partial<ComponentProps<typeof Appearance>> = {}) {
  const props = {
    appSettings: defaultAppSettings,
    onAppSettingsChange: vi.fn(),
    theme: SystemTheme.LIGHT,
    ...overrides
  };

  return render(<Appearance {...props} />);
}
