/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Backups from "../../../../src/views/SettingsWindow/pages/Backups";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  backups: "Backups",
  backupConfigurationCreated: "Backup configuration created",
  backupConfigurationCreatedHelp: "Notes and selected app data are ready to be included in your backup archive.",
  backupSetupFailed: "Couldn't set up backups. Try again.",
  noBackupCreated: "No backup created yet",
  noBackupCreatedHelp: "Set up a local backup archive of your notes and selected app data.",
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

    render(<Backups />);

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
        })
      }
    });

    render(<Backups />);

    await user.click(await screen.findByRole("button", { name: "Set up backups" }));

    expect(desktopApi.backup.initialize).toHaveBeenCalledOnce();
    expect(await screen.findByText("Backup configuration created")).toBeInTheDocument();
    expect(screen.getByText("Notes and selected app data are ready to be included in your backup archive.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Set up backups" })).not.toBeInTheDocument();
  });

  it("shows initialization failures accessibly", async () => {
    const user = userEvent.setup();
    installDesktopApiMock({
      backup: {
        getState: vi.fn().mockResolvedValue(undefined),
        initialize: vi.fn().mockResolvedValue(undefined)
      }
    });

    render(<Backups />);

    await user.click(await screen.findByRole("button", { name: "Set up backups" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't set up backups. Try again.");
  });
});
