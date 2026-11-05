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
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { UserAgent } from "../../../../src/utils/UserAgent";
import SettingsWindow from "../../../../src/views/SettingsWindow/SettingsWindow";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  backups: "Backups",
  backupConfigurationCreated: "Backup configuration created",
  backupConfigurationCreatedHelp: "Notes and selected app data are ready to be included in your backup archive.",
  dataStorage: "Data & storage",
  noBackupCreated: "No backup created yet",
  noBackupCreatedHelp: "Set up a local backup archive of your notes and selected app data.",
  setUpBackups: "Set up backups",
  settingUpBackups: "Setting up...",
  storage: "Storage"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string) => translations[key] ?? key
  })
}));

afterEach(() => {
  UserAgent.isElectron = false;
});

describe("Backups settings integration", () => {
  it("initializes backups from the desktop settings window", async () => {
    const user = userEvent.setup();
    const desktopApi = installDesktopApiMock({
      backup: {
        getState: vi.fn().mockResolvedValue(undefined),
        initialize: vi.fn().mockResolvedValue({
          version: 1,
          initializedAt: "2026-11-05T12:00:00.000Z",
          contentSelection: {
            appSettings: true,
            mainWindowState: true
          }
        })
      }
    });
    UserAgent.isElectron = true;

    render(
      <SettingsWindow
        appSettings={defaultAppSettings}
        onAppSettingsChange={vi.fn()}
        theme={SystemTheme.LIGHT}
      />
    );

    await user.click(screen.getByRole("button", { name: "Backups" }));
    await user.click(await screen.findByRole("button", { name: "Set up backups" }));

    expect(desktopApi.backup.initialize).toHaveBeenCalledOnce();
    expect(await screen.findByText("Backup configuration created")).toBeInTheDocument();
  });
});
