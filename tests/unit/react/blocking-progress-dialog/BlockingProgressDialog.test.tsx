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
import { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import BlockingProgressDialog from "../../../../src/components/BlockingProgressDialog";
import { getAppColors } from "../../../../src/theme/AppColors";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { getMuiDialogRoot } from "../../../utils/react/muiDialog";

describe("BlockingProgressDialog", () => {
  describe("rendering and accessibility", () => {
    it("does not render a dialog when closed", () => {
      renderBlockingProgressDialog({ open: false });

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders the title, status, percentage, and determinate progress bar when open", () => {
      renderBlockingProgressDialog({ status: "Encrypting note 2 of 4", title: "Encrypting notes", value: 50 });

      expect(screen.getByRole("heading", { name: "Encrypting notes" })).toBeInTheDocument();
      expect(screen.getByText("Encrypting note 2 of 4")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByRole("progressbar", { name: "Encrypting notes" })).toHaveAttribute("aria-valuenow", "50");
    });

    it("derives the dialog accessible name from its title", () => {
      renderBlockingProgressDialog({ title: "Decrypting notes" });

      expect(screen.getByRole("dialog", { name: "Decrypting notes" })).toBeInTheDocument();
    });
  });

  describe("progress normalization", () => {
    it("normalizes progress within a custom range", () => {
      renderBlockingProgressDialog({ min: 10, max: 50, value: 30 });

      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    });

    it("rounds the displayed percentage", () => {
      renderBlockingProgressDialog({ value: 33.5 });

      expect(screen.getByText("34%")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "34");
    });

    it.each([
      { description: "below the minimum", value: -10, percentage: "0" },
      { description: "above the maximum", value: 150, percentage: "100" }
    ])("clamps progress $description", ({ value, percentage }) => {
      renderBlockingProgressDialog({ value });

      expect(screen.getByText(`${percentage}%`)).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", percentage);
    });

    it("uses zero percent for an invalid range", () => {
      renderBlockingProgressDialog({ min: 20, max: 20, value: 20 });

      expect(screen.getByText("0%")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    });
  });

  describe("blocking behavior", () => {
    it("remains open when Escape is pressed", () => {
      renderBlockingProgressDialog();

      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("remains open when the backdrop is clicked", () => {
      renderBlockingProgressDialog();

      fireEvent.click(document.querySelector(".MuiBackdrop-root")!);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("theme styling", () => {
    it.each([SystemTheme.LIGHT, SystemTheme.DARK])("uses the %s theme colors", (theme) => {
      renderBlockingProgressDialog({ theme });

      const colors = getAppColors(theme);
      const dialogRoot = getMuiDialogRoot(screen.getByRole("dialog"));

      expect(dialogRoot.style.getPropertyValue("--progress-dialog-background")).toBe(colors.DIALOG_BACKGROUND);
      expect(dialogRoot.style.getPropertyValue("--progress-dialog-backdrop")).toBe(colors.DIALOG_BACKDROP);
      expect(dialogRoot.style.getPropertyValue("--progress-dialog-primary")).toBe(colors.MAIN);
      expect(dialogRoot.style.getPropertyValue("--progress-dialog-text")).toBe(colors.DIALOG_TEXT);
    });
  });
});

function renderBlockingProgressDialog(props?: Partial<ComponentProps<typeof BlockingProgressDialog>>) {
  return render(
    <BlockingProgressDialog
      open
      status="Preparing encrypted storage"
      theme={SystemTheme.LIGHT}
      title="Encrypting notes"
      value={0}
      {...props}
    />
  );
}

