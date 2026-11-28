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
import { ClipboardClearDelay } from "../../../../src/settings/ClipboardClearDelay";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { UserAgent } from "../../../../src/utils/UserAgent";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  about: "About",
  appearance: "Appearance",
  backups: "Backups",
  cancel: "Cancel",
  dataStorage: "Data & storage",
  editor: "Editor",
  general: "General",
  info: "Info",
  later: "Later",
  license: "License",
  links: "Links",
  preferences: "Preferences",
  restartNow: "Restart Now",
  restartToApplyLanguage: "Restart Axion Notes now to apply your language change?",
  restartToApplyLanguageTitle: "Restart to apply language",
  security: "Security",
  clearCopiedNoteTextAfter: "Clear copied note text after",
  clearCopiedNoteTextAfterHelp: "Automatically clear text copied from Axion Notes after the selected delay.",
  clearCopiedTextOnLock: "Clear copied text when application locks",
  clearCopiedTextOnLockHelp: "Automatically clear text copied from Axion Notes when the application locks.",
  shortcuts: "Shortcuts",
  storage: "Storage"
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

  it("navigates every browser settings page and exposes the active page to assistive technology", async () => {
    const user = userEvent.setup();
    UserAgent.isElectron = false;
    installDesktopApiMock();

    render(<SettingsWindow appSettings={defaultAppSettings} onAppSettingsChange={vi.fn()} theme={SystemTheme.LIGHT} embedded />);

    const pages = ["Appearance", "Editor", "Data & storage", "Backups", "License", "Links", "About"];
    expect(screen.getByRole("button", { name: "General" })).toHaveAttribute("aria-current", "page");

    for (const pageName of pages) {
      const pageButton = screen.getByRole("button", { name: pageName });
      await user.click(pageButton);

      expect(screen.getByRole("heading", { level: 1, name: pageName })).toBeVisible();
      expect(pageButton).toHaveAttribute("aria-current", "page");
    }

    expect(screen.queryByRole("button", { name: "Security" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Shortcuts" })).not.toBeInTheDocument();
  });

  it("shows desktop-only settings pages and excludes browser-only information pages", async () => {
    const user = userEvent.setup();
    UserAgent.isElectron = true;
    installDesktopApiMock();

    render(<SettingsWindow appSettings={defaultAppSettings} onAppSettingsChange={vi.fn()} theme={SystemTheme.DARK} />);

    await user.click(screen.getByRole("button", { name: "Security" }));
    expect(screen.getByRole("heading", { level: 1, name: "Security" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Security" })).toHaveAttribute("aria-current", "page");

    await user.click(screen.getByRole("button", { name: "Shortcuts" }));
    expect(screen.getByRole("heading", { level: 1, name: "Shortcuts" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Shortcuts" })).toHaveAttribute("aria-current", "page");

    expect(screen.queryByRole("button", { name: "About" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "License" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Links" })).not.toBeInTheDocument();
  });

  it("defaults clipboard clearing to Never and saves the selected delay", async () => {
    const user = userEvent.setup();
    const onAppSettingsChange = vi.fn();
    UserAgent.isElectron = true;
    installDesktopApiMock();

    render(
      <SettingsWindow
        appSettings={defaultAppSettings}
        onAppSettingsChange={onAppSettingsChange}
        theme={SystemTheme.LIGHT}
      />
    );

    await user.click(screen.getByRole("button", { name: "Security" }));

    const clipboardClearDelay = screen.getByLabelText("Clear copied note text after");
    expect(clipboardClearDelay).toHaveValue(String(ClipboardClearDelay.NEVER));

    await user.selectOptions(clipboardClearDelay, String(ClipboardClearDelay.TWO_MINUTES));

    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...defaultAppSettings,
      clipboardClearDelay: ClipboardClearDelay.TWO_MINUTES
    });
  });

  it("enables clearing copied text on lock only after Application lock is enabled", async () => {
    const user = userEvent.setup();
    const onAppSettingsChange = vi.fn();
    UserAgent.isElectron = true;
    installDesktopApiMock();

    const { unmount } = render(
      <SettingsWindow
        appSettings={defaultAppSettings}
        onAppSettingsChange={onAppSettingsChange}
        theme={SystemTheme.LIGHT}
      />
    );

    await user.click(screen.getByRole("button", { name: "Security" }));

    const clearOnLock = screen.getByRole("checkbox", { name: "Clear copied text when application locks" });
    expect(clearOnLock).toBeDisabled();

    unmount();
    render(
      <SettingsWindow
        appSettings={{ ...defaultAppSettings, lockScreenEnabled: true }}
        onAppSettingsChange={onAppSettingsChange}
        theme={SystemTheme.LIGHT}
      />
    );

    await user.click(screen.getByRole("button", { name: "Security" }));
    const enabledClearOnLock = screen.getByRole("checkbox", { name: "Clear copied text when application locks" });
    expect(enabledClearOnLock).toBeEnabled();
    await user.click(enabledClearOnLock.closest("label")!);

    expect(onAppSettingsChange).toHaveBeenLastCalledWith({
      ...defaultAppSettings,
      clearCopiedTextOnLockEnabled: true,
      lockScreenEnabled: true
    });
  });
});

function StatefulSettingsWindow() {
  const [appSettings, setAppSettings] = useState(defaultAppSettings);

  return <SettingsWindow appSettings={appSettings} onAppSettingsChange={setAppSettings} theme={SystemTheme.LIGHT} />;
}
