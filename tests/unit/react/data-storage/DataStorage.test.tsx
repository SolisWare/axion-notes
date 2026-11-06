/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import DataStorage from "../../../../src/views/SettingsWindow/pages/DataStorage";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

vi.mock("../../../../src/utils/UserAgent", () => ({
  UserAgent: {
    isElectron: true
  }
}));

const translations: Record<string, string> = {
  backupLocation: "Backup location",
  notesLocation: "Notes location",
  passwordEncryptionDataLocation: "Password encryption data location",
  settingsLocation: "Settings location"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key
  })
}));

describe("DataStorage", () => {
  it("displays the managed backup folder location", async () => {
    installDesktopApiMock({
      security: {
        getSecurityFolderLocation: vi.fn().mockResolvedValue("/private/security")
      },
      settings: {
        getSettingsFolderLocation: vi.fn().mockResolvedValue("/private/settings")
      },
      storage: {
        getBackupFolderLocation: vi.fn().mockResolvedValue("/private/backup"),
        getNotesFolderLocation: vi.fn().mockResolvedValue("/private/data")
      }
    });

    render(<DataStorage />);

    expect(await screen.findByText("/private/backup")).toBeInTheDocument();
    expect(screen.getByText("Backup location")).toBeInTheDocument();
  });
});
