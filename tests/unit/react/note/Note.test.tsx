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

const translate = vi.fn((key: string, values?: Record<string, string | number>) => ({
  deselectNote: "Deselect note",
  at: "at",
  modified: "Modified:",
  noteLastModified: "Last modified:",
  selectNote: "Select note",
  title: "Title",
  typeHere: "Type here",
  unpinNote: "Unpin note",
  wordCharacterCount: `${values?.wordCount} words, ${values?.characterCount} characters`
})[key] ?? key);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate })
}));

vi.mock("../../../../src/components/NoteContextMenu", () => ({
  default: (props: {
    onCloseWindow?: () => void;
    onDeleteNote: () => void;
    onDuplicateNote: () => void;
    onFormatAction: (command: string) => void;
    onMoveNoteToBottom: () => void;
    onMoveNoteToTop: () => void;
    onNoteColorChange: (color: NoteColorKey) => void;
    onOpenNoteWindow?: () => void;
    onSelectNote?: () => void;
    onToggleFold?: () => void;
    onTogglePin?: () => void;
    onToggleTitleVisibility?: () => void;
    selectedColor: NoteColorKey;
  }) => (
    <div data-testid="note-context-menu">
      <button type="button" onClick={props.onCloseWindow}>Close window</button>
      <button type="button" onClick={props.onDeleteNote}>Delete note</button>
      <button type="button" onClick={props.onDuplicateNote}>Duplicate note</button>
      <button type="button" onClick={() => props.onFormatAction("bold")}>Format bold</button>
      <button type="button" onClick={props.onMoveNoteToBottom}>Move to bottom</button>
      <button type="button" onClick={props.onMoveNoteToTop}>Move to top</button>
      <button type="button" onClick={() => props.onNoteColorChange(NoteColorKey.BLUE)}>Change color</button>
      <button type="button" onClick={() => props.onNoteColorChange(props.selectedColor)}>Keep color</button>
      <button type="button" onClick={props.onOpenNoteWindow}>Open note window</button>
      <button type="button" onClick={props.onSelectNote}>Select note from menu</button>
      <button type="button" onClick={props.onToggleFold}>Toggle fold</button>
      <button type="button" onClick={props.onTogglePin}>Toggle pin</button>
      <button type="button" onClick={props.onToggleTitleVisibility}>Toggle title visibility</button>
    </div>
  )
}));

vi.mock("../../../../src/components/NoteRichTextEditor", () => ({
  default: (props: {
    formatActionRequest: { command: string; id: number } | null;
    onFormatActionRequestHandled: (requestId: number) => void;
    onFormatStateChange: (state: { canFormat: boolean; isFocused: boolean }) => void;
  }) => (
    <div data-testid="rich-text-editor">
      <output data-testid="format-action">{props.formatActionRequest?.command ?? "none"}</output>
      <button
        type="button"
        onClick={() => props.onFormatStateChange({ canFormat: true, isFocused: true })}
      >
        Focus editor
      </button>
      {props.formatActionRequest && (
        <button type="button" onClick={() => props.onFormatActionRequestHandled(props.formatActionRequest!.id)}>
          Acknowledge format action
        </button>
      )}
    </div>
  )
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

  it("routes context-menu actions to note handlers and saves only actual note changes", () => {
    const handleDeleteNoteButton = vi.fn();
    const handleDuplicateNote = vi.fn();
    const handleMoveNoteToBottom = vi.fn();
    const handleMoveNoteToTop = vi.fn();
    const handleNoteSave = vi.fn();
    const handleOpenNoteWindow = vi.fn();
    const handleToggleNoteFold = vi.fn();
    const handleToggleNotePin = vi.fn();
    const onCloseWindow = vi.fn();
    const onSelectSelection = vi.fn();
    const onDeselectSelection = vi.fn();
    const { container } = renderNote({
      handleDeleteNoteButton,
      handleDuplicateNote,
      handleMoveNoteToBottom,
      handleMoveNoteToTop,
      handleNoteSave,
      handleOpenNoteWindow,
      handleToggleNoteFold,
      handleToggleNotePin,
      isSelected: true,
      isSelectionMode: true,
      onCloseWindow,
      onDeselectSelection,
      onSelectSelection
    });
    const note = container.firstElementChild as HTMLElement;
    const openMenu = () => fireEvent.contextMenu(note, { clientX: 40, clientY: 60 });

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Duplicate note" }));
    expect(handleDuplicateNote).toHaveBeenCalledWith(expect.objectContaining({ id: "note-1" }));

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Move to top" }));
    expect(handleMoveNoteToTop).toHaveBeenCalledWith("note-1");

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Move to bottom" }));
    expect(handleMoveNoteToBottom).toHaveBeenCalledWith("note-1");

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Toggle pin" }));
    expect(handleToggleNotePin).toHaveBeenCalledWith(expect.objectContaining({ id: "note-1" }));

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Toggle fold" }));
    expect(handleToggleNoteFold).toHaveBeenCalledWith(expect.objectContaining({ id: "note-1" }));

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Select note from menu" }));
    expect(onDeselectSelection).toHaveBeenCalledWith("note-1");
    expect(onSelectSelection).not.toHaveBeenCalled();

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Open note window" }));
    expect(handleNoteSave).toHaveBeenCalledWith(expect.objectContaining({ id: "note-1" }));
    expect(handleOpenNoteWindow).toHaveBeenCalledWith("note-1");

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Close window" }));
    expect(onCloseWindow).toHaveBeenCalledOnce();

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Delete note" }));
    expect(handleDeleteNoteButton).toHaveBeenCalledWith("note-1");

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Change color" }));
    expect(handleNoteSave).toHaveBeenLastCalledWith(expect.objectContaining({ bgcolor: NoteColorKey.BLUE }));

    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Keep color" }));
    expect(handleNoteSave).toHaveBeenCalledTimes(2);
  });

  it("toggles title visibility, closes the context menu, and applies rich-text format actions", () => {
    const handleNoteSave = vi.fn();
    const { container } = renderNote({ handleNoteSave, richTextEditorEnabled: true });
    const note = container.firstElementChild as HTMLElement;

    fireEvent.contextMenu(note, { clientX: 40, clientY: 60 });
    fireEvent.click(screen.getByRole("button", { name: "Toggle title visibility" }));

    expect(screen.queryByPlaceholderText("Title")).not.toBeInTheDocument();
    expect(handleNoteSave).toHaveBeenCalledWith(expect.objectContaining({ isTitleHidden: true }));
    expect(screen.queryByTestId("note-context-menu")).not.toBeInTheDocument();

    fireEvent.contextMenu(note, { clientX: 40, clientY: 60 });
    fireEvent.click(screen.getByRole("button", { name: "Format bold" }));

    expect(screen.getByTestId("format-action")).toHaveTextContent("bold");
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge format action" }));
    expect(screen.getByTestId("format-action")).toHaveTextContent("none");
  });

  it("dismisses the context menu with Escape or an outside pointer press", () => {
    const { container } = renderNote();
    const note = container.firstElementChild as HTMLElement;

    fireEvent.contextMenu(note, { clientX: 40, clientY: 60 });
    expect(screen.getByTestId("note-context-menu")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("note-context-menu")).not.toBeInTheDocument();

    fireEvent.contextMenu(note, { clientX: 40, clientY: 60 });
    fireEvent.pointerDown(document.body);
    expect(screen.queryByTestId("note-context-menu")).not.toBeInTheDocument();
  });

  it("selects an unselected note from the context menu", () => {
    const onSelectSelection = vi.fn();
    const { container } = renderNote({
      isSelectionMode: true,
      isSelected: false,
      onSelectSelection
    });

    fireEvent.contextMenu(container.firstElementChild as HTMLElement, { clientX: 40, clientY: 60 });
    fireEvent.click(screen.getByRole("button", { name: "Select note from menu" }));

    expect(onSelectSelection).toHaveBeenCalledWith("note-1");
  });

  it("keeps the drag-indicator row in the layout but inert when manual sorting is disabled", () => {
    const handleToggleNoteFold = vi.fn();
    const { container } = renderNote({
      handleToggleNoteFold,
      reserveDragIndicatorSpace: true,
      showDragIndicator: false
    });
    const dragIndicator = container.querySelector('[aria-hidden="true"]') as HTMLElement;

    expect(dragIndicator).toHaveStyle({ visibility: "hidden" });
    fireEvent.click(dragIndicator);
    expect(handleToggleNoteFold).not.toHaveBeenCalled();
  });

  it("uses the drag indicator to fold once and open a note window on double click", () => {
    const handleOpenNoteWindow = vi.fn();
    const handleNoteSave = vi.fn();
    const handleToggleNoteFold = vi.fn();
    const { container, rerender } = renderNote({ handleToggleNoteFold });
    const dragIndicator = container.querySelector('[aria-hidden="true"]') as HTMLElement;

    fireEvent.click(dragIndicator);
    expect(handleToggleNoteFold).toHaveBeenCalledWith(expect.objectContaining({ id: "note-1" }));

    rerender(
      <Note
        {...defaultNoteProps()}
        handleOpenNoteWindow={handleOpenNoteWindow}
        handleNoteSave={handleNoteSave}
      />
    );
    fireEvent.doubleClick(container.querySelector('[aria-hidden="true"]') as HTMLElement);
    expect(handleOpenNoteWindow).toHaveBeenCalledWith("note-1");
    expect(handleNoteSave).toHaveBeenCalledWith(expect.objectContaining({ id: "note-1" }));
  });

  it("renders note footer details when enabled", () => {
    renderNote({
      note: createNote({ content: "one two three" }),
      showNoteFooters: true,
      showWordCharacterCount: true
    });

    expect(screen.getByText(/Last modified:/)).toBeInTheDocument();
    expect(screen.getByText("3 words, 13 characters")).toBeInTheDocument();
  });

  it("marks note text as a clipboard privacy copy source", () => {
    const { container } = renderNote();

    expect(container.querySelector("[data-note-copy-source]")).toBeInTheDocument();
  });
});

function renderNote(props: Partial<ComponentProps<typeof Note>> = {}) {
  return render(<Note {...defaultNoteProps()} {...props} />);
}

function defaultNoteProps(): ComponentProps<typeof Note> {
  return {
    contentFontSize: 14,
    dateFormat: DateFormat.MonthDayYearSlash,
    handleDeleteNoteButton: vi.fn(),
    handleDuplicateNote: vi.fn(),
    handleMoveNoteToBottom: vi.fn(),
    handleMoveNoteToTop: vi.fn(),
    handleNoteSave: vi.fn(),
    note: createNote(),
    noteFont: NoteFontPreference.SYSTEM,
    noteSize: NoteSizePreference.DEFAULT,
    richTextEditorEnabled: false,
    showNoteFooters: false,
    showTitles: true,
    theme: SystemTheme.LIGHT,
    timeFormat: TimeFormat.Regular,
    titleFont: NoteFontPreference.SYSTEM,
    titleFontSize: 17
  };
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
