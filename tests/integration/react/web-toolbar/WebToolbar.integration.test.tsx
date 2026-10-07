/**
 * Copyright (c) 2026 SolisWare and contributors.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteAccessStatus } from "../../../../src/models/NoteAccessStatus";
import { NoteType } from "../../../../src/models/NoteType";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { NoteColorKey } from "../../../../src/theme/NoteColors";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { UserAgent } from "../../../../src/utils/UserAgent";
import MainWindow from "../../../../src/views/MainWindow/MainWindow";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const { translate } = vi.hoisted(() => {
  const translations: Record<string, string> = {
    addFirstNotePrompt: "Press {{shortcut}} to add your first note",
    cancel: "Cancel",
    close: "Close",
    content: "Content",
    delete: "Delete",
    deleteAll: "Delete All",
    deleteAllNotesHeading: "Delete All Notes",
    deleteAllNotesWarning: "Are you sure you want to delete all notes? This action cannot be undone.",
    deleteSelectedNotes: "Delete Selected Notes",
    deleteSelectedNotesWarning: "Are you sure you want to delete the selected notes? This action cannot be undone.",
    duplicate: "Duplicate",
    general: "General",
    newNote: "New note",
    noNotesYet: "You don't have any notes yet!",
    noteSelectionActions: "Note selection actions",
    preferences: "Preferences",
    selectNotes: "Select notes",
    selectedNotesCount: "{{count}} selected",
    settings: "Settings",
    title: "Title",
    typeHere: "Type here..."
  };

  return {
    translate: vi.fn((key: string, values?: Record<string, string | number>) => {
      let translation = translations[key] ?? key;

      for (const [valueKey, value] of Object.entries(values ?? {})) {
        translation = translation.replace(`{{${valueKey}}}`, String(value));
      }

      return translation;
    })
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

vi.mock("../../../../src/App", () => ({
  AppView: {
    home: "/home",
    welcome: "/welcome",
    lock: "/lock",
    license: "/license"
  }
}));

describe("WebToolbar integration", () => {
  beforeEach(() => {
    translate.mockClear();
    UserAgent.isElectron = false;
    installDesktopApiMock();
  });

  describe("main-window interaction", () => {
    it("adds a note to the visible note list when New note is clicked", async () => {
      const user = userEvent.setup();

      renderMainWindow();

      expect(await screen.findByText("You don't have any notes yet!")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /new note/i }));

      expect(await screen.findByPlaceholderText("Title")).toBeInTheDocument();
      expect(screen.queryByText("You don't have any notes yet!")).not.toBeInTheDocument();
    });

    it("enters note selection mode when Select notes is clicked", async () => {
      const user = userEvent.setup();

      renderMainWindow({ notes: [createNote()] });

      expect(await screen.findByDisplayValue("First note")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /select notes/i }));

      expect(screen.getByRole("toolbar", { name: "Note selection actions" })).toBeInTheDocument();
    });

    it("opens the delete-all confirmation dialog when Delete All is clicked", async () => {
      const user = userEvent.setup();

      renderMainWindow({ notes: [createNote()] });

      expect(await screen.findByDisplayValue("First note")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /delete all/i }));

      expect(screen.getByRole("heading", { name: "Delete All Notes" })).toBeInTheDocument();
      expect(screen.getByText("Are you sure you want to delete all notes? This action cannot be undone.")).toBeInTheDocument();
    });

    it("opens the web settings dialog when Settings is clicked", async () => {
      const user = userEvent.setup();

      renderMainWindow();

      await waitFor(() => expect(screen.getByRole("button", { name: /settings/i })).toBeEnabled());
      await user.click(screen.getByRole("button", { name: /settings/i }));

      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(screen.getByText("Preferences")).toBeInTheDocument();
      expect(screen.getAllByText("General").length).toBeGreaterThan(0);
    });
  });

  describe("state transitions", () => {
    it("enables Select notes and Delete All after adding the first note", async () => {
      const user = userEvent.setup();

      renderMainWindow();

      expect(await screen.findByText("You don't have any notes yet!")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /select notes/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /delete all/i })).toBeDisabled();

      await user.click(screen.getByRole("button", { name: /new note/i }));

      expect(await screen.findByPlaceholderText("Title")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /select notes/i })).toBeEnabled();
      expect(screen.getByRole("button", { name: /delete all/i })).toBeEnabled();
    });

    it("disables Select notes and Delete All again after deleting all notes", async () => {
      const user = userEvent.setup();

      renderMainWindow({ notes: [createNote()] });

      expect(await screen.findByDisplayValue("First note")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /select notes/i })).toBeEnabled();
      expect(screen.getByRole("button", { name: /delete all/i })).toBeEnabled();

      await user.click(screen.getByRole("button", { name: /delete all/i }));
      await user.click(screen.getByRole("button", { name: "Delete All" }));

      expect(await screen.findByText("You don't have any notes yet!")).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Delete All Notes" })).not.toBeInTheDocument());
      expect(screen.getByRole("button", { name: /select notes/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /delete all/i })).toBeDisabled();
    });

    it("restores normal toolbar state after canceling note selection mode", async () => {
      const user = userEvent.setup();

      renderMainWindow({ notes: [createNote()] });

      expect(await screen.findByDisplayValue("First note")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /select notes/i }));

      expect(screen.getByRole("toolbar", { name: "Note selection actions" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /select notes/i })).toBeDisabled();

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("toolbar", { name: "Note selection actions" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /select notes/i })).toBeEnabled();
      expect(screen.getByRole("button", { name: /delete all/i })).toBeEnabled();
    });
  });
});

function renderMainWindow(options?: { notes?: NoteType[] } & Partial<ComponentProps<typeof MainWindow>>) {
  const notes = options?.notes ?? [];

  installDesktopApiMock({
    storage: {
      getNotesWithAccessState: vi.fn().mockResolvedValue({
        status: NoteAccessStatus.AVAILABLE,
        notes
      })
    }
  });

  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <MainWindow
        appSettings={defaultAppSettings}
        onAppSettingsChange={vi.fn()}
        theme={SystemTheme.LIGHT}
        view={"/home" as never}
        {...options}
      />
    </MemoryRouter>
  );
}

function createNote(overrides: Partial<NoteType> = {}): NoteType {
  return {
    id: "note-1",
    bgcolor: NoteColorKey.YELLOW,
    title: "First note",
    content: "First note content",
    createdOn: new Date("2026-01-01T00:00:00.000Z"),
    lastModifiedOn: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides
  };
}
