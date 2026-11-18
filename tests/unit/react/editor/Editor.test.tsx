/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import Editor from "../../../../src/views/SettingsWindow/pages/Editor";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { NoteFontPreference } from "../../../../src/settings/NoteFontPreference";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const translations: Record<string, string> = {
  cancel: "Cancel",
  content: "Content",
  contentFont: "Content font",
  contentFontHelp: "Choose the font for note content",
  contentFontSize: "Content font size",
  contentFontSizeHelp: "Choose the size for note content",
  "fontCategories.calligraphic": "Calligraphic",
  "fontCategories.generic": "Generic",
  "fontCategories.handwriting": "Handwriting",
  "fontCategories.standard": "Standard",
  "fontCategories.typewriter": "Typewriter",
  fontSampleText: "The quick brown fox",
  "fonts.caveat": "Caveat",
  "fonts.dancingScript": "Dancing Script",
  "fonts.inter": "Inter",
  "fonts.lora": "Lora",
  "fonts.monospace": "Monospace",
  "fonts.sansSerif": "Sans serif",
  "fonts.serif": "Serif",
  "fonts.sourceSans3": "Source Sans 3",
  "fonts.sourceSerif4": "Source Serif 4",
  "fonts.spaceMono": "Space Mono",
  "fonts.system": "System default",
  richTextEditor: "Rich text editor",
  richTextEditorDisableWarning: "Existing formatting will remain, but editing controls will be unavailable.",
  richTextEditorHelp: "Enable formatting controls for notes",
  title: "Title",
  titleFont: "Title font",
  titleFontHelp: "Choose the font for note titles",
  titleFontSize: "Title font size",
  titleFontSizeHelp: "Choose the size for note titles",
  turnOff: "Turn off",
  turnOffRichTextEditor: "Turn off rich text editor"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key
  })
}));

describe("Editor", () => {
  it("renders accessible editor controls and excludes fonts reserved for the other field", () => {
    renderEditor();

    expect(screen.getByRole("checkbox", { name: "Rich text editor" })).toBeChecked();
    const titleFont = screen.getByRole("combobox", { name: "Title font" });
    const contentFont = screen.getByRole("combobox", { name: "Content font" });

    expect(within(titleFont).queryByRole("option", { name: "Sans serif" })).not.toBeInTheDocument();
    expect(within(contentFont).queryByRole("option", { name: "Monospace" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Title font size" })).toHaveValue(String(defaultAppSettings.titleFontSize));
    expect(screen.getByRole("combobox", { name: "Content font size" })).toHaveValue(String(defaultAppSettings.contentFontSize));
    expect(screen.getAllByText("The quick brown fox")).toHaveLength(2);
  });

  it("uses System default when the configured font is reserved for the other editor field", () => {
    renderEditor({
      appSettings: {
        ...defaultAppSettings,
        noteFont: NoteFontPreference.MONOSPACE,
        titleFont: NoteFontPreference.SANS_SERIF
      }
    });

    expect(screen.getByRole("combobox", { name: "Title font" })).toHaveValue(NoteFontPreference.SYSTEM);
    expect(screen.getByRole("combobox", { name: "Content font" })).toHaveValue(NoteFontPreference.SYSTEM);
  });

  it("updates font preferences and sizes without discarding other settings", () => {
    const onAppSettingsChange = vi.fn();
    renderEditor({ onAppSettingsChange });

    fireEvent.change(screen.getByRole("combobox", { name: "Title font" }), { target: { value: NoteFontPreference.LORA } });
    fireEvent.change(screen.getByRole("combobox", { name: "Content font" }), { target: { value: NoteFontPreference.INTER } });
    fireEvent.change(screen.getByRole("combobox", { name: "Title font size" }), { target: { value: "24" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Content font size" }), { target: { value: "20" } });

    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, titleFont: NoteFontPreference.LORA });
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, noteFont: NoteFontPreference.INTER });
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, titleFontSize: 24 });
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, contentFontSize: 20 });
  });

  it("requires confirmation before disabling rich text editing and does not update settings when cancelled", async () => {
    const onAppSettingsChange = vi.fn();
    renderEditor({ onAppSettingsChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "Rich text editor" }));

    const dialog = screen.getByRole("dialog", { name: "Turn off rich text editor" });
    expect(dialog).toHaveAccessibleDescription("Existing formatting will remain, but editing controls will be unavailable.");
    expect(onAppSettingsChange).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Turn off rich text editor" })).not.toBeInTheDocument());
    expect(onAppSettingsChange).not.toHaveBeenCalled();
  });

  it("disables after confirmation and enables immediately", async () => {
    const onAppSettingsChange = vi.fn();
    const { rerender } = renderEditor({ onAppSettingsChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "Rich text editor" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Turn off rich text editor" })).getByRole("button", { name: "Turn off" }));
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, richTextEditorEnabled: false });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Turn off rich text editor" })).not.toBeInTheDocument());

    rerender(<Editor appSettings={{ ...defaultAppSettings, richTextEditorEnabled: false }} onAppSettingsChange={onAppSettingsChange} theme={SystemTheme.LIGHT} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Rich text editor" }));
    expect(onAppSettingsChange).toHaveBeenLastCalledWith({ ...defaultAppSettings, richTextEditorEnabled: true });
  });
});

function renderEditor(overrides: Partial<ComponentProps<typeof Editor>> = {}) {
  const props = {
    appSettings: defaultAppSettings,
    onAppSettingsChange: vi.fn(),
    theme: SystemTheme.LIGHT,
    ...overrides
  };

  return render(<Editor {...props} />);
}
