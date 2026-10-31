/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 * 
 * @author Michael Polowczuk
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../../../src/App";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const { i18n, userAgent } = vi.hoisted(() => ({
  i18n: {
    changeLanguage: vi.fn(),
    t: vi.fn((key: string, values?: Record<string, string>) => {
      if (key === "decryptedNotesCleared") {
        return "Decrypted notes cleared";
      }

      if (key === "noteSortDateCreatedAsc") {
        return "Date created (oldest first)";
      }

      return key === "notesResortedBy"
        ? `Notes re-sorted by ${values?.sortOrder}`
        : key;
    })
  },
  userAgent: {
    isElectron: true,
    isMac: false,
    isWindows: false
  }
}));

vi.mock("../../../../src/i18n/i18n", () => ({
  default: i18n
}));

vi.mock("../../../../src/utils/UserAgent", () => ({
  UserAgent: userAgent
}));

vi.mock("electron-router-dom", () => ({
  Router: () => null,
  Route: () => null
}));

describe("AppToast integration", () => {
  beforeEach(() => {
    i18n.changeLanguage.mockClear();
    i18n.t.mockClear();
    userAgent.isElectron = true;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the translated secure-lock completion message and dismisses it after three seconds", async () => {
    let secureLockCompleteHandler: (() => void) | undefined;
    const unsubscribeSecureLockComplete = vi.fn();
    const onSecureLockComplete = vi.fn((callback: () => void) => {
      secureLockCompleteHandler = callback;
      return unsubscribeSecureLockComplete;
    });

    installDesktopApiMock({
      security: {
        getLockState: vi.fn().mockResolvedValue({ isLocked: false }),
        onSecureLockComplete
      },
      settings: {
        getSettings: vi.fn().mockResolvedValue(defaultAppSettings)
      }
    });

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(onSecureLockComplete).toHaveBeenCalledOnce();
    });

    vi.useFakeTimers();
    act(() => {
      secureLockCompleteHandler?.();
    });

    expect(i18n.t).toHaveBeenCalledWith("decryptedNotesCleared");
    expect(screen.getByRole("status")).toHaveTextContent("Decrypted notes cleared");

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    unmount();
  });

  it("unsubscribes from secure-lock completion events when the app unmounts", async () => {
    const unsubscribeSecureLockComplete = vi.fn();
    const onSecureLockComplete = vi.fn(() => unsubscribeSecureLockComplete);

    installDesktopApiMock({
      security: {
        getLockState: vi.fn().mockResolvedValue({ isLocked: false }),
        onSecureLockComplete
      },
      settings: {
        getSettings: vi.fn().mockResolvedValue(defaultAppSettings)
      }
    });

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(onSecureLockComplete).toHaveBeenCalledOnce();
    });

    unmount();

    expect(unsubscribeSecureLockComplete).toHaveBeenCalledOnce();
  });

  it("shows the active sort order after the requesting window applies a re-sort", async () => {
    let sortAppliedHandler: (() => void) | undefined;
    const onSortApplied = vi.fn((callback: () => void) => {
      sortAppliedHandler = callback;
      return vi.fn();
    });

    installDesktopApiMock({
      noteSort: {
        onSortApplied
      },
      security: {
        getLockState: vi.fn().mockResolvedValue({ isLocked: false })
      },
      settings: {
        getSettings: vi.fn().mockResolvedValue(defaultAppSettings)
      }
    });

    render(<App />);

    await waitFor(() => expect(onSortApplied).toHaveBeenCalledOnce());
    act(() => {
      sortAppliedHandler?.();
    });

    expect(i18n.t).toHaveBeenCalledWith("noteSortDateCreatedAsc");
    expect(i18n.t).toHaveBeenCalledWith("notesResortedBy", { sortOrder: "Date created (oldest first)" });
    expect(screen.getByRole("status")).toHaveTextContent("Notes re-sorted by Date created (oldest first)");
  });
});
