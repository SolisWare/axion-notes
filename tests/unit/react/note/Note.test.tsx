/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Note from "../../../../src/components/Note";
import { NoteFontPreference } from "../../../../src/settings/NoteFontPreference";
import { NoteSizePreference } from "../../../../src/settings/noteSizePreference";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { NoteColorKey } from "../../../../src/theme/NoteColors";
import { NoteType } from "../../../../src/types/NoteType";
import { DateFormat } from "../../../../src/utils/dt-formatter/DateFormat";
import { TimeFormat } from "../../../../src/utils/dt-formatter/TimeFormat";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translate = vi.fn((key: string) => ({
  deselectNote: "Deselect note",
  modified: "Modified:",
  noteLastModified: "Last modified:",
  selectNote: "Select note",
  title: "Title",
  typeHere: "Type here",
  unpinNote: "Unpin note"
})[key] ?? key);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate })
}));

describe("Note", () => {
  beforeEach(() => {
    installDesktopApiMock();
    translate.mockClear();
  });

  it("saves title and plain-text content changes with the updated note", () => {
    const handleNoteSave = vi.fn();

    renderNote({ handleNoteSave, richTextEditorEnabled: false });

    fireEvent.change(screen.getByPlaceholderText("Title"), { target: { value: "Updated title" } });
    fireEvent.change(screen.getByPlaceholderText("Type here"), { target: { value: "Updated content" } });

    expect(handleNoteSave).toHaveBeenNthCalledWith(1, expect.objectContaining({
      id: "note-1",
      content: "Initial content",
      title: "Updated title"
    }));
    expect(handleNoteSave).toHaveBeenLastCalledWith(expect.objectContaining({
      id: "note-1",
      content: "Updated content",
      richContent: undefined,
      title: "Updated title"
    }));
  });

  it("exposes selection state and toggles the selected note", () => {
    const onToggleSelection = vi.fn();

    renderNote({
      isSelected: true,
      isSelectionMode: true,
      onToggleSelection
    });

    const selectionButton = screen.getByRole("button", { name: "Deselect note" });
    expect(selectionButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(selectionButton);

    expect(onToggleSelection).toHaveBeenCalledOnce();
    expect(onToggleSelection).toHaveBeenCalledWith("note-1");
  });

  it("lets the user unpin a pinned note when pin handling is available", () => {
    const handleToggleNotePin = vi.fn();

    renderNote({
      handleToggleNotePin,
      note: createNote({ isPinned: true })
    });

    fireEvent.click(screen.getByRole("button", { name: "Unpin note" }));

    expect(handleToggleNotePin).toHaveBeenCalledOnce();
    expect(handleToggleNotePin).toHaveBeenCalledWith(expect.objectContaining({
      id: "note-1",
      isPinned: true
    }));
  });

  it("does not render the title input when the note hides its title", () => {
    renderNote({ note: createNote({ isTitleHidden: true }) });

    expect(screen.queryByPlaceholderText("Title")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type here")).toHaveValue("Initial content");
  });
});

function renderNote(props: Partial<ComponentProps<typeof Note>> = {}) {
  return render(
    <Note
      contentFontSize={14}
      dateFormat={DateFormat.MonthDayYearSlash}
      handleDeleteNoteButton={vi.fn()}
      handleDuplicateNote={vi.fn()}
      handleMoveNoteToBottom={vi.fn()}
      handleMoveNoteToTop={vi.fn()}
      handleNoteSave={vi.fn()}
      note={createNote()}
      noteFont={NoteFontPreference.SYSTEM}
      noteSize={NoteSizePreference.DEFAULT}
      richTextEditorEnabled={false}
      showNoteFooters={false}
      showTitles
      theme={SystemTheme.LIGHT}
      timeFormat={TimeFormat.Regular}
      titleFont={NoteFontPreference.SYSTEM}
      titleFontSize={17}
      {...props}
    />
  );
}

function createNote(overrides: Partial<NoteType> = {}): NoteType {
  return {
    id: "note-1",
    bgcolor: NoteColorKey.YELLOW,
    content: "Initial content",
    title: "Initial title",
    createdOn: new Date("2026-11-08T12:00:00.000Z"),
    lastModifiedOn: new Date("2026-11-08T12:00:00.000Z"),
    ...overrides
  };
}
