/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PasswordStrengthLevel } from "../../../../src/security/PasswordStrengthLevel";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import Security from "../../../../src/views/SettingsWindow/pages/Security";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const { estimatePasswordStrength, translate } = vi.hoisted(() => ({
  estimatePasswordStrength: vi.fn(),
  translate: vi.fn((key: string) => key)
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

describe("Security password dialog integration", () => {
  beforeEach(() => {
    estimatePasswordStrength.mockReturnValue({ level: PasswordStrengthLevel.STRONG });
    translate.mockClear();
  });

  it("sets a password and enables the lock screen when no password exists", async () => {
    const user = userEvent.setup();
    const onAppSettingsChange = vi.fn();
    const desktopApi = installDesktopApiMock({
      security: {
        hasPassword: vi.fn().mockResolvedValue(false),
        setPassword: vi.fn().mockResolvedValue(true)
      }
    });

    renderSecurity({ onAppSettingsChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "notesLock" }));
    await screen.findByRole("dialog", { name: "setLockPassword" });
    await enterNewPassword(user);
    await user.click(screen.getByRole("button", { name: "setPassword" }));

    await waitFor(() => {
      expect(desktopApi.security.setPassword).toHaveBeenCalledWith("strong-password");
      expect(onAppSettingsChange).toHaveBeenCalledWith({
        ...defaultAppSettings,
        lockScreenEnabled: true
      });
    });
    expect(screen.queryByRole("dialog", { name: "setLockPassword" })).not.toBeInTheDocument();
  });

  it("verifies an existing password before enabling the lock screen", async () => {
    const user = userEvent.setup();
    const onAppSettingsChange = vi.fn();
    const desktopApi = installDesktopApiMock({
      security: {
        hasPassword: vi.fn().mockResolvedValue(true),
        verifyPassword: vi.fn().mockResolvedValue(true)
      }
    });

    renderSecurity({ onAppSettingsChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "notesLock" }));
    await screen.findByRole("dialog", { name: "enableLockScreen" });
    await user.type(screen.getByLabelText("currentPassword"), "current-password");
    await user.click(screen.getByRole("button", { name: "enable" }));

    await waitFor(() => {
      expect(desktopApi.security.verifyPassword).toHaveBeenCalledWith("current-password");
      expect(onAppSettingsChange).toHaveBeenCalledWith({
        ...defaultAppSettings,
        lockScreenEnabled: true
      });
    });
  });

  it("keeps the dialog open when an existing password cannot be verified", async () => {
    const user = userEvent.setup();
    const onAppSettingsChange = vi.fn();
    const desktopApi = installDesktopApiMock({
      security: {
        hasPassword: vi.fn().mockResolvedValue(true),
        verifyPassword: vi.fn().mockResolvedValue(false)
      }
    });

    renderSecurity({ onAppSettingsChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "notesLock" }));
    await screen.findByRole("dialog", { name: "enableLockScreen" });
    await user.type(screen.getByLabelText("currentPassword"), "incorrect-password");
    await user.click(screen.getByRole("button", { name: "enable" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("incorrectPassword");
    expect(desktopApi.security.verifyPassword).toHaveBeenCalledWith("incorrect-password");
    expect(onAppSettingsChange).not.toHaveBeenCalled();
  });

  it("verifies then clears the password when disabling the lock screen", async () => {
    const user = userEvent.setup();
    const appSettings = {
      ...defaultAppSettings,
      lockScreenEnabled: true
    };
    const onAppSettingsChange = vi.fn();
    const desktopApi = installDesktopApiMock({
      security: {
        clearPassword: vi.fn().mockResolvedValue(true),
        verifyPassword: vi.fn().mockResolvedValue(true)
      }
    });

    renderSecurity({ appSettings, onAppSettingsChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "notesLock" }));
    await screen.findByRole("dialog", { name: "disableLockScreen" });
    await user.type(screen.getByLabelText("currentPassword"), "current-password");
    await user.click(screen.getByRole("button", { name: "disable" }));

    await waitFor(() => {
      expect(desktopApi.security.verifyPassword).toHaveBeenCalledWith("current-password");
      expect(desktopApi.security.clearPassword).toHaveBeenCalledOnce();
      expect(onAppSettingsChange).toHaveBeenCalledWith({
        ...appSettings,
        lockScreenEnabled: false
      });
    });
  });

  it("changes the password through the desktop API", async () => {
    const user = userEvent.setup();
    const appSettings = {
      ...defaultAppSettings,
      lockScreenEnabled: true
    };
    const desktopApi = installDesktopApiMock({
      security: {
        changePassword: vi.fn().mockResolvedValue(true)
      }
    });

    renderSecurity({ appSettings });

    await user.click(screen.getByRole("button", { name: "changePassword" }));
    await screen.findByRole("dialog", { name: "changePassword" });
    await user.type(screen.getByLabelText("currentPassword"), "current-password");
    await enterNewPassword(user);
    await user.click(screen.getByRole("button", { name: "changePassword" }));

    await waitFor(() => {
      expect(desktopApi.security.changePassword).toHaveBeenCalledWith("current-password", "strong-password");
    });
    expect(screen.queryByRole("dialog", { name: "changePassword" })).not.toBeInTheDocument();
  });

  it("requires confirmation before enabling encryption and then updates settings", async () => {
    const user = userEvent.setup();
    const appSettings = {
      ...defaultAppSettings,
      lockScreenEnabled: true
    };
    const onAppSettingsChange = vi.fn();
    const desktopApi = installDesktopApiMock({
      security: {
        enableEncryption: vi.fn().mockResolvedValue(true)
      }
    });

    renderSecurity({ appSettings, onAppSettingsChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "notesEncryption" }));
    const confirmationDialog = await screen.findByRole("dialog", { name: "enableNoteEncryptionQuestion" });
    await user.click(within(confirmationDialog).getByRole("button", { name: "enable" }));
    await screen.findByRole("dialog", { name: "enableNoteEncryption" });
    await user.type(screen.getByLabelText("currentPassword"), "current-password");
    await user.click(screen.getByRole("button", { name: "encryptNotes" }));

    await waitFor(() => {
      expect(desktopApi.security.enableEncryption).toHaveBeenCalledWith("current-password");
      expect(onAppSettingsChange).toHaveBeenCalledWith({
        ...appSettings,
        notesEncryptionEnabled: true
      });
    });
  });

  it("disables encryption through the desktop API", async () => {
    const user = userEvent.setup();
    const appSettings = {
      ...defaultAppSettings,
      lockScreenEnabled: true,
      notesEncryptionEnabled: true
    };
    const onAppSettingsChange = vi.fn();
    const desktopApi = installDesktopApiMock({
      security: {
        disableEncryption: vi.fn().mockResolvedValue(true)
      }
    });

    renderSecurity({ appSettings, onAppSettingsChange });

    fireEvent.click(screen.getByRole("checkbox", { name: "notesEncryption" }));
    await screen.findByRole("dialog", { name: "disableNoteEncryption" });
    await user.type(screen.getByLabelText("currentPassword"), "current-password");
    await user.click(screen.getByRole("button", { name: "decryptNotes" }));

    await waitFor(() => {
      expect(desktopApi.security.disableEncryption).toHaveBeenCalledWith("current-password");
      expect(onAppSettingsChange).toHaveBeenCalledWith({
        ...appSettings,
        notesEncryptionEnabled: false
      });
    });
  });
});

async function enterNewPassword(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("newPassword"), "strong-password");
  await user.type(screen.getByLabelText("confirmPassword"), "strong-password");
}

function renderSecurity(props?: Partial<ComponentProps<typeof Security>>) {
  return render(
    <Security
      appSettings={defaultAppSettings}
      theme={SystemTheme.LIGHT}
      onAppSettingsChange={vi.fn()}
      {...props}
    />
  );
}
