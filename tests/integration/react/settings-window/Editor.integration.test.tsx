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
import { AppSettings } from "../../../../src/settings/AppSettings";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { UserAgent } from "../../../../src/utils/UserAgent";
import SettingsWindow from "../../../../src/views/SettingsWindow/SettingsWindow";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  appearance: "Appearance",
  backups: "Backups",
  content: "Content",
  contentFont: "Content font",
  contentFontSize: "Content font size",
  dataStorage: "Data & storage",
  editor: "Editor",
  general: "General",
  info: "Info",
  license: "License",
  links: "Links",
  preferences: "Preferences",
  richTextEditor: "Rich text editor",
  storage: "Storage",
  title: "Title",
  titleFont: "Title font",
  titleFontSize: "Title font size"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string) => translations[key] ?? key
  })
}));

describe("SettingsWindow Editor integration", () => {
  afterEach(() => {
    UserAgent.isElectron = false;
  });

  it("routes to Editor and retains changed font preferences through SettingsWindow state", async () => {
    const user = userEvent.setup();
    UserAgent.isElectron = false;
    installDesktopApiMock();

    render(<StatefulSettingsWindow />);

    await user.click(screen.getByRole("button", { name: "Editor" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Title font" }), { target: { value: "lora" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Content font size" }), { target: { value: "20" } });

    expect(screen.getByRole("heading", { name: "Editor" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Title font" })).toHaveValue("lora");
    expect(screen.getByRole("combobox", { name: "Content font size" })).toHaveValue("20");
  });
});

function StatefulSettingsWindow() {
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);

  return <SettingsWindow appSettings={appSettings} onAppSettingsChange={setAppSettings} theme={SystemTheme.LIGHT} />;
}
