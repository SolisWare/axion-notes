/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EncryptionProgressEvent, EncryptionProgressOperation, EncryptionProgressPhase } from "../../../../src/models/EncryptionProgressEvent";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import Security from "../../../../src/views/SettingsWindow/pages/Security";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const { translate } = vi.hoisted(() => ({
  translate: vi.fn((key: string, values?: Record<string, number>) => {
    const translations: Record<string, string> = {
      cleaningUp: "Cleaning up encrypted storage",
      decryptingNotes: "Decrypting notes",
      encryptingNotes: "Encrypting notes",
      preventScreenCapture: "Prevent screen capture",
      preparing: "Preparing encrypted storage",
      verifyingDecryptedNotes: "Verifying decrypted notes",
      verifyingEncryptedNotes: "Verifying encrypted notes"
    };

    if (key === "encryptingNoteCount") {
      return `Encrypting ${values?.current} of ${values?.total}`;
    }

    if (key === "decryptingNoteCount") {
      return `Decrypting ${values?.current} of ${values?.total}`;
    }

    return translations[key] ?? key;
  })
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

describe("Security settings integration", () => {
  beforeEach(() => {
    translate.mockClear();
  });

  it("shows translated encryption progress received from the desktop API", () => {
    let encryptionProgressHandler: ((progress: EncryptionProgressEvent) => void) | undefined;
    const onEncryptionProgress = vi.fn((callback: (progress: EncryptionProgressEvent) => void) => {
      encryptionProgressHandler = callback;
      return vi.fn();
    });
    installDesktopApiMock({
      security: {
        onEncryptionProgress
      }
    });

    renderSecurity();

    act(() => {
      encryptionProgressHandler?.({
        operation: EncryptionProgressOperation.ENCRYPT,
        phase: EncryptionProgressPhase.PROCESSING_NOTES,
        current: 2,
        total: 4,
        progress: 50
      });
    });

    expect(onEncryptionProgress).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog", { name: "Encrypting notes" })).toBeInTheDocument();
    expect(screen.getByText("Encrypting 2 of 4")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Encrypting notes" })).toHaveAttribute("aria-valuenow", "50");
  });

  it("updates the dialog for successive decryption migration phases", () => {
    let encryptionProgressHandler: ((progress: EncryptionProgressEvent) => void) | undefined;
    installDesktopApiMock({
      security: {
        onEncryptionProgress: vi.fn((callback: (progress: EncryptionProgressEvent) => void) => {
          encryptionProgressHandler = callback;
          return vi.fn();
        })
      }
    });

    renderSecurity();

    act(() => {
      encryptionProgressHandler?.({
        operation: EncryptionProgressOperation.DECRYPT,
        phase: EncryptionProgressPhase.PROCESSING_NOTES,
        current: 1,
        total: 3,
        progress: 33
      });
    });
    expect(screen.getByRole("dialog", { name: "Decrypting notes" })).toBeInTheDocument();
    expect(screen.getByText("Decrypting 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();

    act(() => {
      encryptionProgressHandler?.({
        operation: EncryptionProgressOperation.DECRYPT,
        phase: EncryptionProgressPhase.VERIFYING,
        progress: 75
      });
    });
    expect(screen.getByText("Verifying decrypted notes")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();

    act(() => {
      encryptionProgressHandler?.({
        operation: EncryptionProgressOperation.DECRYPT,
        phase: EncryptionProgressPhase.CLEANING_UP,
        progress: 100
      });
    });
    expect(screen.getByText("Cleaning up encrypted storage")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();

    act(() => {
      encryptionProgressHandler?.({
        operation: EncryptionProgressOperation.ENCRYPT,
        phase: EncryptionProgressPhase.VERIFYING,
        progress: 80
      });
    });
    expect(screen.getByRole("dialog", { name: "Encrypting notes" })).toBeInTheDocument();
    expect(screen.getByText("Verifying encrypted notes")).toBeInTheDocument();

    act(() => {
      encryptionProgressHandler?.({
        operation: EncryptionProgressOperation.ENCRYPT,
        phase: EncryptionProgressPhase.PREPARING,
        progress: 0
      });
    });
    expect(screen.getByText("Preparing encrypted storage")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("unsubscribes from encryption progress when unmounted", () => {
    const unsubscribeEncryptionProgress = vi.fn();
    const onEncryptionProgress = vi.fn(() => unsubscribeEncryptionProgress);
    installDesktopApiMock({
      security: {
        onEncryptionProgress
      }
    });

    const { unmount } = renderSecurity();

    unmount();

    expect(onEncryptionProgress).toHaveBeenCalledOnce();
    expect(unsubscribeEncryptionProgress).toHaveBeenCalledOnce();
  });

  it("updates screen capture protection when the lock screen is enabled", () => {
    const onAppSettingsChange = vi.fn();
    const appSettings = {
      ...defaultAppSettings,
      lockScreenEnabled: true
    };
    installDesktopApiMock();

    renderSecurity({ appSettings, onAppSettingsChange });

    const contentProtectionCheckbox = screen.getByRole("checkbox", { name: "Prevent screen capture" });
    expect(contentProtectionCheckbox).toBeChecked();

    fireEvent.click(contentProtectionCheckbox);

    expect(onAppSettingsChange).toHaveBeenCalledWith({
      ...appSettings,
      lockScreenContentProtectionEnabled: false
    });
  });
});

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
