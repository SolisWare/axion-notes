/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SortableNote from "../../../../src/components/SortableNote";
import { NoteFontPreference } from "../../../../src/settings/NoteFontPreference";
import { NoteSizePreference } from "../../../../src/settings/noteSizePreference";
import { NoteColorKey } from "../../../../src/theme/NoteColors";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { NoteType } from "../../../../src/types/NoteType";
import { DateFormat } from "../../../../src/utils/dt-formatter/DateFormat";
import { TimeFormat } from "../../../../src/utils/dt-formatter/TimeFormat";

const { captureNoteProps, setNodeRef, useSortable } = vi.hoisted(() => ({
  captureNoteProps: vi.fn(),
  setNodeRef: vi.fn(),
  useSortable: vi.fn()
}));

vi.mock("@dnd-kit/sortable", () => ({ useSortable }));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: { toString: () => undefined }
  }
}));
vi.mock("../../../../src/components/Note", () => ({
  default: (props: { showDragIndicator?: boolean }) => {
    captureNoteProps(props);
    return <div data-testid="note" />;
  }
}));

describe("SortableNote", () => {
  beforeEach(() => {
    captureNoteProps.mockClear();
    setNodeRef.mockClear();
    useSortable.mockClear();
    useSortable.mockReturnValue({
      attributes: {},
      isDragging: false,
      listeners: {},
      setNodeRef,
      transform: null,
      transition: undefined
    });
  });

  it("enables sortable behavior and the drag indicator by default", () => {
    renderSortableNote();

    expect(useSortable).toHaveBeenCalledWith({ disabled: false, id: "note-1" });
    expect(captureNoteProps).toHaveBeenCalledWith(expect.objectContaining({ showDragIndicator: true }));
    expect(setNodeRef).toHaveBeenCalledWith(screen.getByTestId("note").parentElement);
  });

  it("disables sortable behavior and hides the drag indicator when manual sorting is disabled", () => {
    renderSortableNote({ dragAndDropSortingEnabled: false });

    expect(useSortable).toHaveBeenCalledWith({ disabled: true, id: "note-1" });
    expect(captureNoteProps).toHaveBeenCalledWith(expect.objectContaining({ showDragIndicator: false }));
  });
});

function renderSortableNote(overrides: Partial<ComponentProps<typeof SortableNote>> = {}) {
  return render(
    <SortableNote
      contentFontSize={14}
      dateFormat={DateFormat.MonthDayYearSlash}
      dragAndDropSortingEnabled
      handleDeleteNoteButton={vi.fn()}
      handleDuplicateNote={vi.fn()}
      handleMoveNoteToBottom={vi.fn()}
      handleMoveNoteToTop={vi.fn()}
      handleNoteSave={vi.fn()}
      handleToggleNotePin={vi.fn()}
      note={createNote()}
      noteFont={NoteFontPreference.SYSTEM}
      noteSize={NoteSizePreference.DEFAULT}
      richTextEditorEnabled
      showFloatingFormatToolbar
      showNoteFooters
      showTitles
      theme={SystemTheme.LIGHT}
      timeFormat={TimeFormat.Regular}
      titleFont={NoteFontPreference.SYSTEM}
      titleFontSize={17}
      {...overrides}
    />
  );
}

function createNote(): NoteType {
  return {
    bgcolor: NoteColorKey.YELLOW,
    content: "Note content",
    createdOn: new Date("2026-01-01T00:00:00.000Z"),
    id: "note-1",
    lastModifiedOn: new Date("2026-01-01T00:00:00.000Z"),
    title: "Note title"
  };
}
