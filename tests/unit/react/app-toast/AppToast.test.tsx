/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 * 
 * @author Michael Polowczuk
 */
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppToast from "../../../../src/components/AppToast";
import { getAppColors } from "../../../../src/theme/AppColors";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

describe("AppToast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering and accessibility", () => {
    it("does not render when closed", () => {
      renderAppToast({ open: false });

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("renders its message as a polite status update when open", () => {
      renderAppToast({ message: "Notes cleared", open: true });

      const toast = screen.getByRole("status");

      expect(toast).toHaveTextContent("Notes cleared");
      expect(toast).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("theme styling", () => {
    it.each([SystemTheme.LIGHT, SystemTheme.DARK])("uses the %s theme colors", (theme) => {
      renderAppToast({ theme });

      const toast = screen.getByRole("status");
      const colors = getAppColors(theme);

      expect(toast.style.getPropertyValue("--toast-background")).toBe(colors.NOTE_TEXT);
      expect(toast.style.getPropertyValue("--toast-text")).toBe(colors.MAIN_TEXT);
    });
  });

  describe("automatic dismissal", () => {
    it("calls onClose once after three seconds", () => {
      vi.useFakeTimers();
      const onClose = vi.fn();

      renderAppToast({ onClose });

      act(() => {
        vi.advanceTimersByTime(2_999);
      });
      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("does not schedule dismissal while closed", () => {
      vi.useFakeTimers();
      const onClose = vi.fn();

      renderAppToast({ onClose, open: false });

      act(() => {
        vi.advanceTimersByTime(3_000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("cancels dismissal when closed before the timeout", () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      const { rerender } = renderAppToast({ onClose });

      rerender(<AppToast message="Notes decrypted" open={false} theme={SystemTheme.LIGHT} onClose={onClose} />);

      act(() => {
        vi.advanceTimersByTime(3_000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("cancels dismissal when unmounted", () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      const { unmount } = renderAppToast({ onClose });

      unmount();

      act(() => {
        vi.advanceTimersByTime(3_000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });

    it("starts a fresh dismissal timeout when reopened", () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      const { rerender } = renderAppToast({ onClose });

      act(() => {
        vi.advanceTimersByTime(2_000);
      });

      rerender(<AppToast message="Notes decrypted" open={false} theme={SystemTheme.LIGHT} onClose={onClose} />);
      rerender(<AppToast message="Notes decrypted" open theme={SystemTheme.LIGHT} onClose={onClose} />);

      act(() => {
        vi.advanceTimersByTime(2_999);
      });
      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});

function renderAppToast(props?: Partial<ComponentProps<typeof AppToast>>) {
  return render(
    <AppToast
      message="Notes decrypted"
      open
      theme={SystemTheme.LIGHT}
      onClose={vi.fn()}
      {...props}
    />
  );
}
