/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Backups from "../../../../src/views/SettingsWindow/pages/Backups";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  appPreferences: "App preferences",
  appPreferencesHelp: "Theme, language, editor preferences, and other app settings",
  backups: "Backups",
  backupOptions: "Backup Options",
  backupOptionsSaveFailed: "Couldn't save backup options. Try again.",
  backupConfigurationCreated: "Backup configuration created",
  backupConfigurationCreatedHelp: "Notes and selected app data are ready to be included in your backup archive.",
  backupSetupFailed: "Couldn't set up backups. Try again.",
  noBackupCreated: "No backup created yet",
  noBackupCreatedHelp: "Set up a local backup archive of your notes and selected app data.",
  notesAndNoteOrder: "Notes and note order",
  notesAndNoteOrderHelp: "Always included",
  options: "Options...",
  cancel: "Cancel",
  includedInBackups: "Included in backups",
  mainWindowLayout: "Main-window layout",
  mainWindowLayoutHelp: "Main window size, position, and selected notes layout",
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

describe("Backups", () => {
  it("shows an accessible uninitialized backup state after loading", async () => {
    installDesktopApiMock();

    render(<Backups theme={SystemTheme.LIGHT} />);

    expect(screen.getByRole("heading", { name: "Backups" })).toBeInTheDocument();
    expect(await screen.findByText("No backup created yet")).toBeInTheDocument();
    expect(screen.getByText("Set up a local backup archive of your notes and selected app data.")).toBeInTheDocument();
  });

  it("initializes backups and shows the configured state", async () => {
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
        }),
        updateContentSelection: vi.fn().mockResolvedValue({
          version: 1,
          initializedAt: "2026-11-05T12:00:00.000Z",
          contentSelection: {
            appSettings: false,
            mainWindowState: true
          }
        })
      }
    });

    render(<Backups theme={SystemTheme.LIGHT} />);

    await user.click(await screen.findByRole("button", { name: "Set up backups" }));

    expect(desktopApi.backup.initialize).toHaveBeenCalledOnce();
    expect(await screen.findByText("Backup configuration created")).toBeInTheDocument();
    expect(screen.getByText("Notes and selected app data are ready to be included in your backup archive.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Set up backups" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Options..." }));

    expect(screen.getByRole("dialog", { name: "Backup Options" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "App preferences" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(desktopApi.backup.updateContentSelection).toHaveBeenCalledWith({
      appSettings: false,
      mainWindowState: true
    });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Backup Options" })).not.toBeInTheDocument());
  });

  it("shows initialization failures accessibly", async () => {
    const user = userEvent.setup();
    installDesktopApiMock({
      backup: {
        getState: vi.fn().mockResolvedValue(undefined),
        initialize: vi.fn().mockResolvedValue(undefined)
      }
    });

    render(<Backups theme={SystemTheme.LIGHT} />);

    await user.click(await screen.findByRole("button", { name: "Set up backups" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't set up backups. Try again.");
  });
});
