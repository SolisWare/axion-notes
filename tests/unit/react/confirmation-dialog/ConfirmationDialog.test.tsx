/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfirmationDialog from "../../../../src/components/ConfirmationDialog";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const { translate } = vi.hoisted(() => ({
  translate: vi.fn((key: string) => key === "cancel" ? "Cancel" : key)
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

describe("ConfirmationDialog", () => {
  beforeEach(() => {
    translate.mockClear();
  });

  describe("rendering and accessibility", () => {
    it("does not render a dialog when closed", () => {
      renderConfirmationDialog({ open: false });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("uses its title and message as the accessible dialog name and description", () => {
      renderConfirmationDialog({ title: "Delete all notes", message: "This cannot be undone." });

      const dialog = screen.getByRole("dialog", { name: "Delete all notes" });

      expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
      expect(screen.getByRole("heading", { name: "Delete all notes" })).toBeInTheDocument();
      expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    });

    it("uses the translated Cancel label by default and focuses it as the safe action", () => {
      renderConfirmationDialog();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });

      expect(cancelButton).toHaveFocus();
      expect(translate).toHaveBeenCalledWith("cancel");
    });

    it("uses a supplied cancel label", () => {
      renderConfirmationDialog({ cancelLabel: "Keep my notes" });

      expect(screen.getByRole("button", { name: "Keep my notes" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    });
  });

  describe("actions and dismissal", () => {
    it("calls onConfirm when the confirm action is selected", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      renderConfirmationDialog({ onConfirm, onCancel });

      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(onConfirm).toHaveBeenCalledOnce();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("calls onCancel when the cancel action is selected", async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      renderConfirmationDialog({ onConfirm, onCancel });

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onCancel).toHaveBeenCalledOnce();
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("treats Escape as cancellation", () => {
      const onCancel = vi.fn();

      renderConfirmationDialog({ onCancel });
      fireEvent.keyDown(screen.getByRole("button", { name: "Cancel" }), { key: "Escape" });

      expect(onCancel).toHaveBeenCalledOnce();
    });

    it("ignores backdrop clicks", () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      renderConfirmationDialog({ onConfirm, onCancel });
      fireEvent.click(document.querySelector(".MuiBackdrop-root")!);

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("confirmation styling", () => {
    it("uses an error-colored confirm action by default", () => {
      renderConfirmationDialog();

      expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("MuiButton-containedError");
    });

    it("uses a primary-colored confirm action when requested", () => {
      renderConfirmationDialog({ confirmColor: "primary" });

      expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("MuiButton-containedPrimary");
    });
  });
});

function renderConfirmationDialog(props?: Partial<ComponentProps<typeof ConfirmationDialog>>) {
  return render(
    <ConfirmationDialog
      cancelLabel={undefined}
      confirmLabel="Delete"
      message="This will permanently remove every note."
      open
      theme={SystemTheme.LIGHT}
      title="Delete all notes"
      onCancel={vi.fn()}
      onConfirm={vi.fn()}
      {...props}
    />
  );
}
