/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsWindow from "../../../../src/views/SettingsWindow/SettingsWindow";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { UserAgent } from "../../../../src/utils/UserAgent";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  cancel: "Cancel",
  later: "Later",
  restartNow: "Restart Now",
  restartToApplyLanguage: "Restart Axion Notes now to apply your language change?",
  restartToApplyLanguageTitle: "Restart to apply language"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string) => translations[key] ?? key
  })
}));

describe("SettingsWindow", () => {
  afterEach(() => {
    UserAgent.isElectron = false;
  });

  it("offers to restart after changing the desktop language and restarts when confirmed", async () => {
    const user = userEvent.setup();
    const desktopApi = installDesktopApiMock();
    const onAppSettingsChange = vi.fn();
    UserAgent.isElectron = true;

    render(
      <SettingsWindow
        appSettings={defaultAppSettings}
        onAppSettingsChange={onAppSettingsChange}
        theme={SystemTheme.LIGHT}
      />
    );

    await user.selectOptions(screen.getByLabelText("language"), "es");

    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, language: "es" });
    expect(screen.getByRole("dialog", { name: "Restart to apply language" })).toHaveAccessibleDescription(
      "Restart Axion Notes now to apply your language change?"
    );

    await user.click(screen.getByRole("button", { name: "Restart Now" }));

    expect(desktopApi.appWindow.restart).toHaveBeenCalledOnce();
  });

  it("keeps the app running when restart is deferred", async () => {
    const user = userEvent.setup();
    const desktopApi = installDesktopApiMock();
    UserAgent.isElectron = true;

    render(
      <SettingsWindow
        appSettings={defaultAppSettings}
        onAppSettingsChange={vi.fn()}
        theme={SystemTheme.LIGHT}
      />
    );

    await user.selectOptions(screen.getByLabelText("language"), "es");
    await user.click(screen.getByRole("button", { name: "Later" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Restart to apply language" })).not.toBeInTheDocument());
    expect(desktopApi.appWindow.restart).not.toHaveBeenCalled();
  });

  it("does not prompt for restart when switching back to the active language", async () => {
    const user = userEvent.setup();
    UserAgent.isElectron = true;

    render(<StatefulSettingsWindow />);

    await user.selectOptions(screen.getByLabelText("language"), "es");
    await user.click(screen.getByRole("button", { name: "Later" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Restart to apply language" })).not.toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText("language"), "en");

    expect(screen.queryByRole("dialog", { name: "Restart to apply language" })).not.toBeInTheDocument();
  });
});

function StatefulSettingsWindow() {
  const [appSettings, setAppSettings] = useState(defaultAppSettings);

  return <SettingsWindow appSettings={appSettings} onAppSettingsChange={setAppSettings} theme={SystemTheme.LIGHT} />;
}
