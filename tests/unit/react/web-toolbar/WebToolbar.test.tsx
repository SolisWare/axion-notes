/**
 * Copyright (c) 2026 SolisWare and contributors.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WebToolbar from "../../../../src/components/WebToolbar";
import { AppTheme } from "../../../../src/theme/AppTheme";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const { translate } = vi.hoisted(() => {
  const translations: Record<string, string> = {
    newNote: "New note",
    selectNotes: "Select notes",
    deleteAll: "Delete All",
    settings: "Settings"
  };

  return {
    translate: vi.fn((key: string) => translations[key] ?? key)
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

describe("WebToolbar", () => {
  beforeEach(() => {
    translate.mockClear();
    setDesktopPlatform({ isWindows: false });
  });

  describe("basic rendering", () => {
    it("renders the toolbar title", () => {
      renderWebToolbar({ title: "Axion Notes" });

      expect(screen.getByRole("heading", { name: "Axion Notes" })).toBeInTheDocument();
    });

    it("renders the translated toolbar actions", () => {
      renderWebToolbar();

      expect(screen.getByRole("button", { name: /new note/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /select notes/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete all/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    });

    it("renders four toolbar buttons", () => {
      renderWebToolbar();

      expect(screen.getAllByRole("button")).toHaveLength(4);
    });
  });

  describe("button actions", () => {
    it("calls the add-note handler when New note is clicked", async () => {
      const user = userEvent.setup();
      const handlers = createToolbarHandlers();

      renderWebToolbar(handlers);

      await user.click(screen.getByRole("button", { name: /new note/i }));

      expect(handlers.handleAddNoteButton).toHaveBeenCalledOnce();
      expect(handlers.handleSelectNotesButton).not.toHaveBeenCalled();
      expect(handlers.handleDeleteAllNotesButton).not.toHaveBeenCalled();
      expect(handlers.handleSettingsButton).not.toHaveBeenCalled();
    });

    it("calls the select-notes handler when Select notes is clicked", async () => {
      const user = userEvent.setup();
      const handlers = createToolbarHandlers();

      renderWebToolbar(handlers);

      await user.click(screen.getByRole("button", { name: /select notes/i }));

      expect(handlers.handleAddNoteButton).not.toHaveBeenCalled();
      expect(handlers.handleSelectNotesButton).toHaveBeenCalledOnce();
      expect(handlers.handleDeleteAllNotesButton).not.toHaveBeenCalled();
      expect(handlers.handleSettingsButton).not.toHaveBeenCalled();
    });

    it("calls the delete-all handler when Delete All is clicked", async () => {
      const user = userEvent.setup();
      const handlers = createToolbarHandlers();

      renderWebToolbar(handlers);

      await user.click(screen.getByRole("button", { name: /delete all/i }));

      expect(handlers.handleAddNoteButton).not.toHaveBeenCalled();
      expect(handlers.handleSelectNotesButton).not.toHaveBeenCalled();
      expect(handlers.handleDeleteAllNotesButton).toHaveBeenCalledOnce();
      expect(handlers.handleSettingsButton).not.toHaveBeenCalled();
    });

    it("calls the settings handler when Settings is clicked", async () => {
      const user = userEvent.setup();
      const handlers = createToolbarHandlers();

      renderWebToolbar(handlers);

      await user.click(screen.getByRole("button", { name: /settings/i }));

      expect(handlers.handleAddNoteButton).not.toHaveBeenCalled();
      expect(handlers.handleSelectNotesButton).not.toHaveBeenCalled();
      expect(handlers.handleDeleteAllNotesButton).not.toHaveBeenCalled();
      expect(handlers.handleSettingsButton).toHaveBeenCalledOnce();
    });
  });
});

function renderWebToolbar(props?: Partial<ComponentProps<typeof WebToolbar>>) {
  return render(
    <ThemeProvider theme={AppTheme.LightTheme}>
      <WebToolbar
        theme={SystemTheme.LIGHT}
        title="Axion Notes"
        isDeleteAllButtonDisabled={false}
        isSelectNotesButtonDisabled={false}
        handleAddNoteButton={vi.fn()}
        handleSelectNotesButton={vi.fn()}
        handleDeleteAllNotesButton={vi.fn()}
        handleSettingsButton={vi.fn()}
        {...props}
      />
    </ThemeProvider>
  );
}

function createToolbarHandlers() {
  return {
    handleAddNoteButton: vi.fn(),
    handleSelectNotesButton: vi.fn(),
    handleDeleteAllNotesButton: vi.fn(),
    handleSettingsButton: vi.fn()
  };
}

function setDesktopPlatform(platform: { isWindows: boolean }) {
  Object.defineProperty(window, "api", {
    configurable: true,
    value: {
      os: {
        isWindows: platform.isWindows
      }
    }
  });
}
