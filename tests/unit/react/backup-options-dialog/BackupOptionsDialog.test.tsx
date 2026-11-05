/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BackupOptionsDialog from "../../../../src/components/BackupOptionsDialog";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      backupOptions: "Backup Options",
      close: "Close"
    })[key] ?? key
  })
}));

describe("BackupOptionsDialog", () => {
  it("is not rendered while closed", () => {
    renderBackupOptionsDialog({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses its title as the accessible dialog name", () => {
    renderBackupOptionsDialog();

    expect(screen.getByRole("dialog", { name: "Backup Options" })).toBeInTheDocument();
  });

  it("closes when its Close action is selected", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderBackupOptionsDialog({ onClose });

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses the primary contained style for its Close action", () => {
    renderBackupOptionsDialog();

    expect(screen.getByRole("button", { name: "Close" })).toHaveClass("MuiButton-containedPrimary");
  });

  it("does not close when its backdrop is selected", () => {
    const onClose = vi.fn();
    renderBackupOptionsDialog({ onClose });

    fireEvent.click(document.querySelector(".MuiBackdrop-root")!);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Backup Options" })).toBeInTheDocument();
  });
});

function renderBackupOptionsDialog(props?: Partial<React.ComponentProps<typeof BackupOptionsDialog>>) {
  return render(
    <BackupOptionsDialog
      open
      theme={SystemTheme.LIGHT}
      onClose={vi.fn()}
      {...props}
    />
  );
}
