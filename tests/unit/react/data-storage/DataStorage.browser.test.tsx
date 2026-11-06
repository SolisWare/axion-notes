/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DataStorage from "../../../../src/views/SettingsWindow/pages/DataStorage";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

vi.mock("../../../../src/utils/UserAgent", () => ({
  UserAgent: {
    isElectron: false
  }
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      backupLocation: "Backup location",
      notesLocation: "Notes location",
      passwordEncryptionDataLocation: "Password encryption data location",
      settingsLocation: "Settings location"
    })[key] ?? key
  })
}));

describe("DataStorage on web", () => {
  it("does not show or request a managed backup folder", async () => {
    const browserApi = installDesktopApiMock({
      storage: {
        getBackupFolderLocation: vi.fn().mockResolvedValue("/private/backup"),
        getNotesFolderLocation: vi.fn().mockResolvedValue("Browser local storage")
      }
    });

    render(<DataStorage />);

    expect(await screen.findByText("Browser local storage")).toBeInTheDocument();
    expect(screen.queryByText("Backup location")).not.toBeInTheDocument();
    expect(browserApi.storage.getBackupFolderLocation).not.toHaveBeenCalled();
  });
});
