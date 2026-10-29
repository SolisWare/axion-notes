/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import SecurityPasswordDialog, { SecurityPasswordDialogMode } from "../../../../src/components/SecurityPasswordDialog";
import { PasswordStrengthLevel } from "../../../../src/security/PasswordStrengthLevel";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const { estimatePasswordStrength, translate } = vi.hoisted(() => ({
  estimatePasswordStrength: vi.fn(),
  translate: vi.fn((key: string, values?: Record<string, string | number>) => {
    if (key === "passwordMinLength") {
      return `passwordMinLength:${values?.minLength}`;
    }

    return key;
  })
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

vi.mock("../../../../src/security/passwordStrength", () => ({
  estimatePasswordStrength
}));

vi.mock("../../../../src/components/PasswordStrengthMeter", () => ({
  default: () => <div data-testid="password-strength-meter" />
}));

describe("SecurityPasswordDialog", () => {
  it("does not render when closed", () => {
    renderSecurityPasswordDialog({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("derives its accessible name and description from the mode-specific content", async () => {
    renderSecurityPasswordDialog();

    const dialog = screen.getByRole("dialog", { name: "setLockPassword" });

    expect(dialog).toHaveAccessibleDescription("setLockPasswordInstructions");
    await waitFor(() => {
      expect(screen.getByLabelText("newPassword")).toHaveFocus();
    });
    expect(screen.getByLabelText("confirmPassword")).toHaveAttribute("type", "password");
    expect(screen.getAllByRole("button", { name: "showPassword" })).toHaveLength(1);
  });

  it.each([
    {
      mode: SecurityPasswordDialogMode.SET,
      title: "setLockPassword",
      confirmLabel: "setPassword",
      currentPassword: false,
      newPassword: true
    },
    {
      mode: SecurityPasswordDialogMode.ENABLE,
      title: "enableLockScreen",
      confirmLabel: "enable",
      currentPassword: true,
      newPassword: false
    },
    {
      mode: SecurityPasswordDialogMode.DISABLE,
      title: "disableLockScreen",
      confirmLabel: "disable",
      currentPassword: true,
      newPassword: false
    },
    {
      mode: SecurityPasswordDialogMode.ENABLE_ENCRYPTION,
      title: "enableNoteEncryption",
      confirmLabel: "encryptNotes",
      currentPassword: true,
      newPassword: false
    },
    {
      mode: SecurityPasswordDialogMode.DISABLE_ENCRYPTION,
      title: "disableNoteEncryption",
      confirmLabel: "decryptNotes",
      currentPassword: true,
      newPassword: false
    },
    {
      mode: SecurityPasswordDialogMode.CHANGE,
      title: "changePassword",
      confirmLabel: "changePassword",
      currentPassword: true,
      newPassword: true
    }
  ])("renders the required fields and labels for $mode mode", ({ mode, title, confirmLabel, currentPassword, newPassword }) => {
    renderSecurityPasswordDialog({ mode });

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: confirmLabel })).toBeDisabled();
    expect(screen.queryByLabelText("currentPassword")).toBe(currentPassword ? screen.getByLabelText("currentPassword") : null);
    expect(screen.queryByLabelText("newPassword")).toBe(newPassword ? screen.getByLabelText("newPassword") : null);
    expect(screen.queryByLabelText("confirmPassword")).toBe(newPassword ? screen.getByLabelText("confirmPassword") : null);
    expect(screen.queryByTestId("password-strength-meter")).toBe(newPassword ? screen.getByTestId("password-strength-meter") : null);
  });

  it("shows validation feedback without submitting an undersized password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    renderSecurityPasswordDialog({ onSubmit });

    await user.type(screen.getByLabelText("newPassword"), "abc");
    await user.type(screen.getByLabelText("confirmPassword"), "abc");
    await user.click(screen.getByRole("button", { name: "setPassword" }));

    expect(screen.getByRole("alert")).toHaveTextContent("passwordMinLength:4");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects mismatched password confirmation", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    mockPasswordStrength(PasswordStrengthLevel.STRONG);
    renderSecurityPasswordDialog({ onSubmit });

    await user.type(screen.getByLabelText("newPassword"), "strong-password");
    await user.type(screen.getByLabelText("confirmPassword"), "different-password");
    await user.click(screen.getByRole("button", { name: "setPassword" }));

    expect(screen.getByRole("alert")).toHaveTextContent("passwordsDoNotMatch");
    expect(screen.getByLabelText("newPassword")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("confirmPassword")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("newPassword")).toHaveAccessibleDescription("passwordsDoNotMatch");
    expect(screen.getByLabelText("confirmPassword")).toHaveAccessibleDescription("passwordsDoNotMatch");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid new password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    mockPasswordStrength(PasswordStrengthLevel.STRONG);
    renderSecurityPasswordDialog({ onSubmit });

    await user.type(screen.getByLabelText("newPassword"), "strong-password");
    await user.type(screen.getByLabelText("confirmPassword"), "strong-password");
    await user.click(screen.getByRole("button", { name: "setPassword" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        currentPassword: "",
        newPassword: "strong-password"
      });
    });
  });

  it("submits the current password for an existing security action", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    renderSecurityPasswordDialog({ mode: SecurityPasswordDialogMode.DISABLE, onSubmit });

    await user.type(screen.getByLabelText("currentPassword"), "current-password");
    await user.click(screen.getByRole("button", { name: "disable" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        currentPassword: "current-password",
        newPassword: ""
      });
    });
  });

  it("shows an invalid-password error when submission fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(false);

    renderSecurityPasswordDialog({ mode: SecurityPasswordDialogMode.DISABLE, onSubmit });

    await user.type(screen.getByLabelText("currentPassword"), "incorrect-password");
    await user.click(screen.getByRole("button", { name: "disable" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("incorrectPassword");
    expect(screen.getByRole("button", { name: "disable" })).toBeEnabled();
  });

  it("shows and hides current and new passwords", () => {
    renderSecurityPasswordDialog({ mode: SecurityPasswordDialogMode.CHANGE });

    const currentPassword = screen.getByLabelText("currentPassword");
    const newPassword = screen.getByLabelText("newPassword");
    const confirmPassword = screen.getByLabelText("confirmPassword");

    fireEvent.click(screen.getAllByRole("button", { name: "showPassword" })[0]);
    expect(currentPassword).toHaveAttribute("type", "text");
    expect(newPassword).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "showPassword" }));
    expect(newPassword).toHaveAttribute("type", "text");
    expect(confirmPassword).toHaveAttribute("type", "text");
  });

  it("requires confirmation before submitting a weak password", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    mockPasswordStrength(PasswordStrengthLevel.WEAK);
    renderSecurityPasswordDialog({ onSubmit });

    await user.type(screen.getByLabelText("newPassword"), "weak-password");
    await user.type(screen.getByLabelText("confirmPassword"), "weak-password");
    await user.click(screen.getByRole("button", { name: "setPassword" }));

    expect(screen.getByRole("dialog", { name: "useWeakPasswordQuestion" })).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "useAnyway" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        currentPassword: "",
        newPassword: "weak-password"
      });
    });
  });

  it("does not submit a weak password when its warning is cancelled", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    mockPasswordStrength(PasswordStrengthLevel.VERY_WEAK);
    renderSecurityPasswordDialog({ onSubmit });

    await user.type(screen.getByLabelText("newPassword"), "weak-password");
    await user.type(screen.getByLabelText("confirmPassword"), "weak-password");
    await user.click(screen.getByRole("button", { name: "setPassword" }));
    await user.click(screen.getByRole("button", { name: "goBack" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("newPassword")).toHaveValue("weak-password");
  });

  it("prevents duplicate submissions while an action is pending", async () => {
    const user = userEvent.setup();
    let resolveSubmission: ((didSubmit: boolean) => void) | undefined;
    const onSubmit = vi.fn(() => new Promise<boolean>((resolve) => {
      resolveSubmission = resolve;
    }));

    renderSecurityPasswordDialog({ mode: SecurityPasswordDialogMode.DISABLE, onSubmit });

    await user.type(screen.getByLabelText("currentPassword"), "current-password");
    await user.click(screen.getByRole("button", { name: "disable" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });
    expect(screen.getByRole("button", { name: "cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "disable" })).toBeDisabled();

    resolveSubmission?.(true);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "disable" })).toBeEnabled();
    });
  });

  it("cancels for Escape but ignores backdrop clicks", () => {
    const onCancel = vi.fn();

    renderSecurityPasswordDialog({ onCancel });

    fireEvent.click(document.querySelector(".MuiBackdrop-root")!);
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("clears entered state when reopened", async () => {
    const user = userEvent.setup();
    const { rerender } = renderSecurityPasswordDialog();

    await user.type(screen.getByLabelText("newPassword"), "strong-password");
    await user.type(screen.getByLabelText("confirmPassword"), "strong-password");

    rerenderSecurityPasswordDialog(rerender, { open: false });
    rerenderSecurityPasswordDialog(rerender, { open: true });

    expect(screen.getByLabelText("newPassword")).toHaveValue("");
    expect(screen.getByLabelText("confirmPassword")).toHaveValue("");
  });
});

function mockPasswordStrength(level: PasswordStrengthLevel) {
  estimatePasswordStrength.mockReturnValue({ level });
}

function renderSecurityPasswordDialog(props?: Partial<ComponentProps<typeof SecurityPasswordDialog>>) {
  return render(createSecurityPasswordDialog(props));
}

function rerenderSecurityPasswordDialog(
  rerender: (ui: React.ReactNode) => void,
  props?: Partial<ComponentProps<typeof SecurityPasswordDialog>>
) {
  rerender(createSecurityPasswordDialog(props));
}

function createSecurityPasswordDialog(props?: Partial<ComponentProps<typeof SecurityPasswordDialog>>) {
  return (
    <SecurityPasswordDialog
      mode={SecurityPasswordDialogMode.SET}
      open
      theme={SystemTheme.LIGHT}
      onCancel={vi.fn()}
      onSubmit={vi.fn().mockResolvedValue(true)}
      {...props}
    />
  );
}
