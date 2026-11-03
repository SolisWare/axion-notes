/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import Backups from "../../../../src/views/SettingsWindow/pages/Backups";

const translations: Record<string, string> = {
  backups: "Backups",
  noBackupCreated: "No backup created yet",
  noBackupCreatedHelp: "Set up a local backup archive of your notes and selected app data.",
  setUpBackups: "Set up backups"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key
  })
}));

describe("Backups", () => {
  it("shows an accessible uninitialized backup state", () => {
    render(<Backups />);

    expect(screen.getByRole("heading", { name: "Backups" })).toBeInTheDocument();
    expect(screen.getByText("No backup created yet")).toBeInTheDocument();
    expect(screen.getByText("Set up a local backup archive of your notes and selected app data.")).toBeInTheDocument();
  });

  it("shows setup as unavailable until backup initialization is implemented", () => {
    render(<Backups />);

    expect(screen.getByRole("button", { name: "Set up backups" })).toBeDisabled();
  });
});
