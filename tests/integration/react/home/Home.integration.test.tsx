/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { NoteLayoutPreference } from "../../../../src/settings/NoteLayoutPreference";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { NoteType } from "../../../../src/types/NoteType";
import Home from "../../../../src/views/MainWindow/pages/Home";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  addFirstNotePrompt: "Press {{shortcut}} to add your first note",
  noNotesYet: "You don't have any notes yet!",
  notTheNotesYouAreLookingFor: "Nothing to see here. These are not the notes you are looking for.",
  passwordProtected: "{{appName}} is password protected."
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => {
      const translation = translations[key] ?? key;

      return Object.entries(values ?? {}).reduce(
        (result, [name, value]) => result.replace(`{{${name}}}`, value),
        translation
      );
    }
  })
}));

describe("Home empty note state", () => {
  it("does not show the empty state until notes have loaded", () => {
    installDesktopApiMock();

    renderHome({ hasLoadedNotes: false });

    expect(screen.queryByRole("heading", { name: "You don't have any notes yet!" })).not.toBeInTheDocument();
  });

  it("shows the normal or privacy-safe empty state after loading", () => {
    installDesktopApiMock({ os: { isMac: false } });
    const { rerender } = renderHome({ hasLoadedNotes: true });

    expect(screen.getByRole("heading", { name: "You don't have any notes yet!" })).toBeInTheDocument();
    expect(screen.getByText("Press Ctrl+N to add your first note")).toBeInTheDocument();

    rerender(createHomeElement({ hasLoadedNotes: true, isLocked: true }));

    expect(screen.getByRole("heading", { name: "Axion Notes is password protected." })).toBeInTheDocument();
    expect(screen.getByText("Nothing to see here. These are not the notes you are looking for.")).toBeInTheDocument();
    expect(screen.queryByText("Press Ctrl+N to add your first note")).not.toBeInTheDocument();
  });

  it("replaces the empty state with the loaded note grid", () => {
    installDesktopApiMock();
    const { rerender } = renderHome({ hasLoadedNotes: true });

    expect(screen.getByRole("heading", { name: "You don't have any notes yet!" })).toBeInTheDocument();

    rerender(createHomeElement({
      hasLoadedNotes: true,
      notes: [createNote()]
    }));

    expect(screen.queryByRole("heading", { name: "You don't have any notes yet!" })).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("First note")).toBeInTheDocument();
  });
});

function createHomeElement(overrides?: Partial<Parameters<typeof Home>[0]>) {
  return <Home {...createHomeProps(overrides)} />;
}

function renderHome(overrides?: Partial<Parameters<typeof Home>[0]>) {
  return render(createHomeElement(overrides));
}

function createHomeProps(overrides?: Partial<Parameters<typeof Home>[0]>) {
  return {
    notes: [],
    hasLoadedNotes: true,
    theme: SystemTheme.LIGHT,
    dateFormat: defaultAppSettings.dateFormat,
    timeFormat: defaultAppSettings.timeFormat,
    noteFont: defaultAppSettings.noteFont,
    titleFont: defaultAppSettings.titleFont,
    contentFontSize: defaultAppSettings.contentFontSize,
    titleFontSize: defaultAppSettings.titleFontSize,
    richTextEditorEnabled: defaultAppSettings.richTextEditorEnabled,
    noteLayout: NoteLayoutPreference.GRID,
    noteSize: defaultAppSettings.noteSize,
    showTitles: true,
    showNoteFooters: false,
    showFloatingFormatToolbar: false,
    handleDeleteNoteButton: vi.fn(),
    handleDuplicateNote: vi.fn(),
    handleMoveNoteToBottom: vi.fn(),
    handleMoveNoteToTop: vi.fn(),
    handleNoteSave: vi.fn(),
    handleNoteReorder: vi.fn(),
    handleToggleNotePin: vi.fn(),
    isSelectionMode: false,
    selectedNoteIds: new Set<string>(),
    onEnterSelectionMode: vi.fn(),
    onSelectNoteSelection: vi.fn(),
    onDeselectNoteSelection: vi.fn(),
    onToggleNoteSelection: vi.fn(),
    ...overrides
  };
}

function createNote(): NoteType {
  return {
    id: "note-1",
    bgcolor: "yellow",
    title: "First note",
    content: "Note content",
    createdOn: new Date("2026-11-06T12:00:00.000Z"),
    lastModifiedOn: new Date("2026-11-06T12:00:00.000Z")
  };
}
