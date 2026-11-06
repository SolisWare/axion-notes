/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Backups from "../../../../src/views/SettingsWindow/pages/Backups";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

vi.mock("../../../../src/utils/UserAgent", () => ({
  UserAgent: {
    isElectron: false
  }
}));

const translations: Record<string, string> = {
  appPreferences: "App preferences",
  appPreferencesHelp: "Theme, language, editor preferences, and other app settings",
  backupConfigurationCreated: "Ready to create a backup",
  backupConfigurationCreatedHelp: "Notes and selected app data are ready to be included in your backup archive.",
  backupDownloadStarted: "Backup download started",
  backupOptions: "Backup Options",
  backupOptionsSaveFailed: "Couldn't save backup options. Try again.",
  backupSetupFailed: "Couldn't set up backups. Try again.",
  cancel: "Cancel",
  downloadBackup: "Download backup",
  downloadNewBackup: "Download new backup",
  downloadingBackup: "Preparing your backup download...",
  includedInBackups: "Included in backups",
  lastBackupCreatedHelp: "{{date}} at {{time}}",
  lastBackupDownloadStarted: "Last backup download started",
  noBackupDownloaded: "No backup downloaded yet",
  noBackupDownloadedHelp: "Set up a backup download of your notes and selected app data.",
  notesAndNoteOrder: "Notes and note order",
  notesAndNoteOrderHelp: "Always included",
  options: "Options...",
  save: "Save",
  saving: "Saving...",
  setUpBackups: "Set up backups",
  settingUpBackups: "Setting up..."
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key
  })
}));

describe("Backups on web", () => {
  it("creates a download and omits desktop-only managed archive controls", async () => {
    const user = userEvent.setup();
    const browserApi = installDesktopApiMock({
      backup: {
        createArchive: vi.fn().mockResolvedValue({
          status: "created",
          state: {
            version: 1,
            initializedAt: "2026-11-06T10:00:00.000Z",
            contentSelection: { appSettings: true, mainWindowState: false },
            lastBackupCreatedAt: "2026-11-06T10:30:00.000Z"
          }
        }),
        getState: vi.fn().mockResolvedValue({
          version: 1,
          initializedAt: "2026-11-06T10:00:00.000Z",
          contentSelection: { appSettings: true, mainWindowState: false }
        })
      }
    });

    render(<Backups appSettings={defaultAppSettings} theme={SystemTheme.LIGHT} />);

    await user.click(await screen.findByRole("button", { name: "Download backup" }));

    expect(browserApi.backup.createArchive).toHaveBeenCalledWith(undefined);
    expect(await screen.findByText("Last backup download started")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Download backup" })).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Backup download started");
    expect(screen.queryByRole("button", { name: "Save a copy…" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete backup" })).not.toBeInTheDocument();
  });

  it("hides the main-window layout option from browser backup settings", async () => {
    const user = userEvent.setup();
    installDesktopApiMock({
      backup: {
        getState: vi.fn().mockResolvedValue({
          version: 1,
          initializedAt: "2026-11-06T10:00:00.000Z",
          contentSelection: { appSettings: true, mainWindowState: false }
        })
      }
    });

    render(<Backups appSettings={defaultAppSettings} theme={SystemTheme.LIGHT} />);

    await user.click(await screen.findByRole("button", { name: "Options..." }));

    expect(screen.getByRole("dialog", { name: "Backup Options" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "mainWindowLayout" })).not.toBeInTheDocument();
  });
});
