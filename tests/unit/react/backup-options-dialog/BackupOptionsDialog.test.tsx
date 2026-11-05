/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import BackupOptionsDialog from "../../../../src/components/BackupOptionsDialog";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const translations: Record<string, string> = {
  appPreferences: "App preferences",
  appPreferencesHelp: "Theme, language, editor preferences, and other app settings",
  backupOptions: "Backup Options",
  backupOptionsSaveFailed: "Couldn't save backup options. Try again.",
  cancel: "Cancel",
  includedInBackups: "Included in backups",
  mainWindowLayout: "Main-window layout",
  mainWindowLayoutHelp: "Main window size, position, and selected notes layout",
  notesAndNoteOrder: "Notes and note order",
  notesAndNoteOrderHelp: "Always included",
  save: "Save",
  saving: "Saving..."
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key
  })
}));

describe("BackupOptionsDialog", () => {
  it("is not rendered while closed", () => {
    renderBackupOptionsDialog({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses its title as the accessible dialog name and lists backup content", () => {
    renderBackupOptionsDialog();

    expect(screen.getByRole("dialog", { name: "Backup Options" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Included in backups" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Notes and note order" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Notes and note order" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "App preferences" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Main-window layout" })).toBeChecked();
  });

  it("saves the selected optional content and closes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(true);
    renderBackupOptionsDialog({ onClose, onSave });

    await user.click(screen.getByRole("checkbox", { name: "App preferences" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledWith({
      appSettings: false,
      mainWindowState: true
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the dialog open and announces save failures", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderBackupOptionsDialog({ onClose, onSave: vi.fn().mockResolvedValue(false) });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save backup options. Try again.");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when Cancel is selected", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderBackupOptionsDialog({ onClose });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses the primary contained style for its Save action", () => {
    renderBackupOptionsDialog();

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("MuiButton-containedPrimary");
  });

  it("does not close when its backdrop is selected", () => {
    const onClose = vi.fn();
    renderBackupOptionsDialog({ onClose });

    fireEvent.click(document.querySelector(".MuiBackdrop-root")!);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Backup Options" })).toBeInTheDocument();
  });
});

function renderBackupOptionsDialog(props?: Partial<ComponentProps<typeof BackupOptionsDialog>>) {
  return render(
    <BackupOptionsDialog
      contentSelection={{
        appSettings: true,
        mainWindowState: true
      }}
      open
      theme={SystemTheme.LIGHT}
      onClose={vi.fn()}
      onSave={vi.fn().mockResolvedValue(true)}
      {...props}
    />
  );
}
