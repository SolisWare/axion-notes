/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Backups from "../../../../src/views/SettingsWindow/pages/Backups";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  appPreferences: "App preferences",
  appPreferencesHelp: "Theme, language, editor preferences, and other app settings",
  backups: "Backups",
  backupOptions: "Backup Options",
  backupOptionsSaveFailed: "Couldn't save backup options. Try again.",
  backupConfigurationCreated: "Backup configuration created",
  backupConfigurationCreatedHelp: "Notes and selected app data are ready to be included in your backup archive.",
  backupCreated: "Backup created",
  backupCopySaved: "Backup copy saved",
  backupCopySaveFailed: "Couldn't save the backup copy. Try again.",
  backupDeleted: "Backup deleted",
  backupDeleteFailed: "Couldn't delete the backup. Try again.",
  backupSetupFailed: "Couldn't set up backups. Try again.",
  createBackup: "Create backup",
  createNewBackup: "Create new backup",
  creatingBackup: "Creating your backup archive...",
  deletingBackup: "Deleting backup...",
  deleteBackup: "Delete backup",
  deleteBackupHeading: "Delete Backup",
  deleteBackupWarning: "Delete the managed backup archive? This cannot be undone.",
  lastBackupCreated: "Last backup created",
  lastBackupCreatedHelp: "{{date}} at {{time}}",
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
  saveBackupCopy: "Save a copy…",
  savingBackupCopy: "Saving copy...",
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

    render(<Backups appSettings={defaultAppSettings} theme={SystemTheme.LIGHT} />);

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

    render(<Backups appSettings={defaultAppSettings} theme={SystemTheme.LIGHT} />);

    await user.click(await screen.findByRole("button", { name: "Set up backups" }));

    expect(desktopApi.backup.initialize).toHaveBeenCalledOnce();
    expect(await screen.findByText("Backup configuration created")).toBeInTheDocument();
    expect(screen.getByText("Notes and selected app data are ready to be included in your backup archive.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Set up backups" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create backup" })).toBeEnabled();
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

    render(<Backups appSettings={defaultAppSettings} theme={SystemTheme.LIGHT} />);

    await user.click(await screen.findByRole("button", { name: "Set up backups" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't set up backups. Try again.");
  });

  it("creates a backup using the saved content selection without reopening options", async () => {
    const user = userEvent.setup();
    const configuredState = {
      version: 1 as const,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: {
        appSettings: true,
        mainWindowState: true
      }
    };
    const desktopApi = installDesktopApiMock({
      backup: {
        createArchive: vi.fn().mockResolvedValue({
          status: "created",
          state: {
            ...configuredState,
            lastBackupCreatedAt: "2026-11-05T12:30:00.000Z"
          }
        }),
        getState: vi.fn().mockResolvedValue(configuredState)
      }
    });

    render(<Backups appSettings={defaultAppSettings} theme={SystemTheme.LIGHT} />);

    await user.click(await screen.findByRole("button", { name: "Create backup" }));

    expect(desktopApi.backup.createArchive).toHaveBeenCalledWith(undefined);
    expect(await screen.findByRole("button", { name: "Create new backup" })).toBeInTheDocument();
    expect(screen.getByText("Last backup created")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Backup created");
  });

  it("saves a copy of an existing backup", async () => {
    const user = userEvent.setup();
    const desktopApi = installDesktopApiMock({
      backup: {
        getState: vi.fn().mockResolvedValue({
          version: 1,
          initializedAt: "2026-11-05T12:00:00.000Z",
          contentSelection: { appSettings: true, mainWindowState: true },
          lastBackupCreatedAt: "2026-11-05T12:30:00.000Z"
        }),
        saveCopy: vi.fn().mockResolvedValue({ status: "saved" })
      }
    });

    render(<Backups appSettings={defaultAppSettings} theme={SystemTheme.LIGHT} />);

    await user.click(await screen.findByRole("button", { name: "Save a copy…" }));

    expect(desktopApi.backup.saveCopy).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Backup copy saved");
  });

  it("deletes an existing backup after confirmation while retaining its configuration", async () => {
    const user = userEvent.setup();
    const configuredState = {
      version: 1 as const,
      initializedAt: "2026-11-05T12:00:00.000Z",
      contentSelection: { appSettings: true, mainWindowState: true },
      lastBackupCreatedAt: "2026-11-05T12:30:00.000Z"
    };
    const desktopApi = installDesktopApiMock({
      backup: {
        deleteArchive: vi.fn().mockResolvedValue({
          status: "deleted",
          state: {
            version: configuredState.version,
            initializedAt: configuredState.initializedAt,
            contentSelection: configuredState.contentSelection
          }
        }),
        getState: vi.fn().mockResolvedValue(configuredState)
      }
    });

    render(<Backups appSettings={defaultAppSettings} theme={SystemTheme.LIGHT} />);

    await user.click(await screen.findByRole("button", { name: "Delete backup" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete Backup" });
    await user.click(within(dialog).getByRole("button", { name: "Delete backup" }));

    expect(desktopApi.backup.deleteArchive).toHaveBeenCalledOnce();
    expect(await screen.findByRole("button", { name: "Create backup" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Backup deleted");
  });
});
