/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LockScreen from "../../../../src/views/MainWindow/pages/LockScreen";
import { UnlockResultStatus } from "../../../../src/types/UnlockResultStatus";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { createDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  appCannotUnlockNeedsRepair: "Axion Notes cannot unlock until it is repaired",
  bruteForceProtectionDisabled: "Brute-force protection is off",
  bruteForceProtectionEnabled: "Brute-force protection is on",
  enterPassword: "Enter password",
  enterPasswordToContinue: "Enter a password to continue",
  enterPasswordToViewNotes: "Enter your password to view your notes",
  hidePassword: "Hide password",
  incorrectPassword: "Incorrect password",
  lockPasswordDataDamaged: "Password data is damaged",
  notesEncrypted: "Notes are encrypted",
  notesLocked: "Notes are locked",
  notesNotEncrypted: "Notes are not encrypted",
  offlineOnly: "Your notes stay on this device",
  showPassword: "Show password",
  tooManyIncorrectAttempts: "Too many incorrect attempts",
  tryAgainIn: "Try again in {{countdown}}",
  unlockNotes: "Unlock notes"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => key === "tryAgainIn"
      ? `Try again in ${values?.countdown}`
      : translations[key] ?? key
  })
}));
vi.mock("../../../../src/App", () => ({
  AppView: { home: "/home" }
}));

describe("LockScreen", () => {
  let emitLockStateChange: ((state: { isRecoveryRequired: boolean; unlockCooldownUntil?: string }) => void) | undefined;
  let emitSettingsChange: ((settings: { bruteForceProtectionEnabled: boolean; notesEncryptionEnabled: boolean }) => void) | undefined;
  let offLockStateChange: ReturnType<typeof vi.fn>;
  let offSettingsChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    emitLockStateChange = undefined;
    emitSettingsChange = undefined;
    offLockStateChange = vi.fn();
    offSettingsChange = vi.fn();
    const desktopApi = createDesktopApiMock({
      security: {
        getLockState: vi.fn().mockResolvedValue({ isLocked: true, isRecoveryRequired: false }),
        onLockStateChange: vi.fn((callback) => {
          emitLockStateChange = callback;
          return offLockStateChange;
        }),
        unlock: vi.fn().mockResolvedValue({ status: UnlockResultStatus.UNLOCKED })
      },
      settings: {
        getSettings: vi.fn().mockResolvedValue({ bruteForceProtectionEnabled: true, notesEncryptionEnabled: false }),
        onSettingsChange: vi.fn((callback) => {
          emitSettingsChange = callback;
          return offSettingsChange;
        })
      },
      version: { getShortDisplayVersion: vi.fn(() => "v9.8.7") }
    });
    window.api = desktopApi;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the locked state accessibly, loads its security disclosures, and calls onReady", async () => {
    const onReady = vi.fn();
    renderLockScreen({ onReady });

    expect(screen.getByRole("heading", { name: "Notes are locked" })).toBeVisible();
    const password = screen.getByLabelText("Enter password");
    await waitFor(() => expect(onReady).toHaveBeenCalledOnce());
    expect(password).toHaveFocus();
    expect(screen.getByText("Brute-force protection is on")).toBeVisible();
    expect(screen.getByText("Notes are not encrypted")).toBeVisible();
    expect(screen.getByText("Axion Notes v9.8.7")).toBeVisible();
  });

  it("toggles password visibility and unlocks the application after a successful password", async () => {
    const user = userEvent.setup();
    renderLockScreen();
    const password = await screen.findByLabelText("Enter password");

    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    await user.type(password, "correct-password");
    await user.click(screen.getByRole("button", { name: "Unlock notes" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/home"));
    expect(window.api.security.unlock).toHaveBeenCalledWith("correct-password");
  });

  it("clears a rejected password, reports the failure, and returns focus to the password field", async () => {
    window.api.security.unlock = vi.fn().mockResolvedValue({ status: UnlockResultStatus.INVALID_PASSWORD });
    const user = userEvent.setup();
    renderLockScreen();
    const password = await screen.findByLabelText("Enter password");

    await user.type(password, "wrong-password");
    await user.click(screen.getByRole("button", { name: "Unlock notes" }));

    await expect(screen.findByRole("alert")).resolves.toHaveTextContent("Incorrect password");
    expect(password).toHaveValue("");
    expect(password).toHaveFocus();
  });

  it("disables attempts during a cooldown and updates disclosure state from subscriptions", async () => {
    const cooldownUntil = new Date(Date.now() + 70_000).toISOString();
    window.api.security.getLockState = vi.fn().mockResolvedValue({ isLocked: true, isRecoveryRequired: false, unlockCooldownUntil: cooldownUntil });
    renderLockScreen();

    const password = await screen.findByLabelText("Enter password");
    await expect(screen.findByRole("alert")).resolves.toHaveTextContent("Too many incorrect attempts");
    expect(password).toBeDisabled();
    expect(screen.getByRole("button", { name: "Unlock notes" })).toBeDisabled();

    act(() => emitSettingsChange?.({ bruteForceProtectionEnabled: false, notesEncryptionEnabled: true }));
    expect(screen.getByText("Brute-force protection is off")).toBeVisible();
    expect(screen.getByText("Notes are encrypted")).toBeVisible();

    act(() => emitLockStateChange?.({ isRecoveryRequired: false }));
    await waitFor(() => expect(password).not.toBeDisabled());
  });

  it("shows recovery guidance instead of password controls when password data requires repair", async () => {
    window.api.security.getLockState = vi.fn().mockResolvedValue({ isLocked: true, isRecoveryRequired: true });
    renderLockScreen();

    const recoveryAlert = await screen.findByRole("alert");
    expect(recoveryAlert).toHaveTextContent("Password data is damaged");
    expect(screen.queryByLabelText("Enter password")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Unlock notes" })).not.toBeInTheDocument();
  });

  it("unsubscribes from desktop state updates when unmounted", async () => {
    const { unmount } = renderLockScreen();
    await screen.findByLabelText("Enter password");

    unmount();

    expect(offLockStateChange).toHaveBeenCalledOnce();
    expect(offSettingsChange).toHaveBeenCalledOnce();
  });
});

function renderLockScreen(props: Partial<Parameters<typeof LockScreen>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={["/lock"]}>
      <Routes>
        <Route path="*" element={<><LockScreen theme={SystemTheme.LIGHT} {...props} /><Location /></>} />
      </Routes>
    </MemoryRouter>
  );
}

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}
