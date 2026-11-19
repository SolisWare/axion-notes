/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NoteList from "../../../../src/components/NoteList";
import { NoteFontPreference } from "../../../../src/settings/NoteFontPreference";
import { NoteSizePreference } from "../../../../src/settings/noteSizePreference";
import { DateFormat } from "../../../../src/utils/dt-formatter/DateFormat";
import { TimeFormat } from "../../../../src/utils/dt-formatter/TimeFormat";
import { NoteColorKey } from "../../../../src/theme/NoteColors";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { NoteType } from "../../../../src/types/NoteType";

type DragEndHandler = (event: { active: { id: string }; over: { id: string } | null }) => void;

type DndContextProps = {
  children: ReactNode;
  onDragEnd: DragEndHandler;
  sensors: unknown[];
};

type NoteProps = {
  handleNoteSave: (note: NoteType) => void;
  handleToggleNoteFold: (note: NoteType) => void;
  note: NoteType;
};

type ContextMenuProps = {
  onDeleteNote: () => void;
  onDuplicateNote: () => void;
  onMoveNoteToBottom: () => void;
  onMoveNoteToTop: () => void;
  onNoteColorChange: (color: NoteColorKey) => void;
  onOpenNoteWindow?: () => void;
  onSelectNote: () => void;
  onToggleFold: () => void;
  onTogglePin: () => void;
  onToggleTitleVisibility: () => void;
};

const { captureDndContextProps, captureNoteProps, captureContextMenuProps, useSensor, useSensors } = vi.hoisted(() => ({
  captureDndContextProps: vi.fn(),
  captureNoteProps: vi.fn(),
  captureContextMenuProps: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn()
}));

vi.mock("@dnd-kit/core", () => ({
  closestCenter: vi.fn(),
  DndContext: ({ children, ...props }: DndContextProps) => {
    captureDndContextProps(props);
    return <div data-testid="dnd-context">{children}</div>;
  },
  PointerSensor: class {},
  useSensor,
  useSensors
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: vi.fn()
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("../../../../src/components/SortableNoteListItem", () => ({
  default: ({ children, id }: { children: ReactNode; id: string }) => <div data-sortable-id={id}>{children}</div>
}));
vi.mock("../../../../src/components/Note", () => ({
  default: (props: NoteProps) => {
    captureNoteProps(props);
    return <div data-testid="expanded-note">{props.note.title}</div>;
  }
}));
vi.mock("../../../../src/components/NoteContextMenu", () => ({
  default: (props: ContextMenuProps) => {
    captureContextMenuProps(props);
    return <div data-testid="note-context-menu" />;
  }
}));

const foldedNote = createNote({
  id: "folded-note",
  content: "\n First visible line \nSecond line",
  isFolded: true,
  isPinned: true,
  title: "Folded title"
});
const expandedNote = createNote({ id: "expanded-note", isFolded: false, title: "Expanded title" });

describe("NoteList", () => {
  beforeEach(() => {
    captureDndContextProps.mockClear();
    captureNoteProps.mockClear();
    captureContextMenuProps.mockClear();
    useSensor.mockImplementation((_sensor, options) => ({ options, sensor: "pointer" }));
    useSensors.mockImplementation((...sensors) => sensors);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders folded-note content, selection state, and folded actions", () => {
    const props = createProps({
      isSelectionMode: true,
      notes: [foldedNote],
      selectedNoteIds: new Set([foldedNote.id])
    });

    render(<NoteList {...props} />);

    expect(screen.getByText("Folded title")).toBeVisible();
    expect(screen.getByText("First visible line")).toBeVisible();
    expect(screen.getByRole("button", { name: "deselectNote" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "deselectNote" }));
    expect(props.onToggleNoteSelection).toHaveBeenCalledWith(foldedNote.id);

    fireEvent.click(screen.getByRole("button", { name: "unpinNote" }));
    expect(props.handleToggleNotePin).toHaveBeenCalledWith(foldedNote);

    fireEvent.click(screen.getByRole("button", { name: "unfoldNote" }));
    expect(props.handleNoteSave).toHaveBeenCalledWith({ ...foldedNote, isFolded: false });
  });

  it("uses the drag indicator for delayed folding, double-click opening, and modifier selection", () => {
    vi.useFakeTimers();
    const props = createProps({ notes: [foldedNote] });
    const { container } = render(<NoteList {...props} />);
    const dragIndicatorRow = getDragIndicatorRow(container);

    fireEvent.click(dragIndicatorRow);
    act(() => vi.advanceTimersByTime(220));
    expect(props.handleNoteSave).toHaveBeenCalledWith({ ...foldedNote, isFolded: false });

    fireEvent.click(dragIndicatorRow);
    fireEvent.click(dragIndicatorRow);
    expect(props.handleOpenNoteWindow).toHaveBeenCalledWith(foldedNote.id);

    fireEvent.click(dragIndicatorRow, { ctrlKey: true });
    expect(props.onToggleNoteSelection).toHaveBeenCalledWith(foldedNote.id);
  });

  it("forwards only meaningful completed drag operations to note ordering", () => {
    const props = createProps({ notes: [foldedNote, expandedNote] });
    render(<NoteList {...props} />);
    const onDragEnd = lastDndContextProps().onDragEnd;

    act(() => onDragEnd({ active: { id: foldedNote.id }, over: { id: expandedNote.id } }));
    expect(props.handleNoteReorder).toHaveBeenCalledWith(foldedNote.id, expandedNote.id);

    act(() => onDragEnd({ active: { id: foldedNote.id }, over: { id: foldedNote.id } }));
    act(() => onDragEnd({ active: { id: foldedNote.id }, over: null }));
    expect(props.handleNoteReorder).toHaveBeenCalledOnce();
  });

  it("hides drag affordances while preserving their layout space and disables sorting when manual sorting is off", () => {
    const props = createProps({ dragAndDropSortingEnabled: false, notes: [foldedNote, expandedNote] });
    const { container } = render(<NoteList {...props} />);

    expect(container.querySelector("div[aria-hidden='true']")).toHaveStyle({ visibility: "hidden" });
    expect(lastDndContextProps().sensors).toEqual([expect.objectContaining({ sensor: "pointer" })]);
    expect(useSensor).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ enabled: false }));

    act(() => lastDndContextProps().onDragEnd({ active: { id: foldedNote.id }, over: { id: expandedNote.id } }));
    expect(props.handleNoteReorder).not.toHaveBeenCalled();
  });

  it("routes expanded-note saves and folding through the list state", () => {
    vi.useFakeTimers();
    const props = createProps({ notes: [expandedNote] });
    render(<NoteList {...props} />);
    const noteProps = lastNoteProps();

    act(() => noteProps.handleToggleNoteFold(expandedNote));
    act(() => vi.advanceTimersByTime(220));
    expect(props.handleNoteSave).toHaveBeenCalledWith({ ...expandedNote, isFolded: true });

    const changedNote = { ...expandedNote, content: "Updated" };
    act(() => noteProps.handleNoteSave(changedNote));
    expect(props.handleNoteSave).toHaveBeenLastCalledWith({ ...changedNote, isFolded: true });
  });

  it("routes folded context-menu actions and dismisses the menu from the document", async () => {
    const props = createProps({ notes: [foldedNote] });
    render(<NoteList {...props} />);

    openFoldedNoteContextMenu();
    await waitFor(() => expect(screen.getByTestId("note-context-menu")).toBeInTheDocument());
    act(() => lastContextMenuProps().onDuplicateNote());
    expect(props.handleDuplicateNote).toHaveBeenCalledWith(foldedNote);

    openFoldedNoteContextMenu();
    act(() => lastContextMenuProps().onNoteColorChange(NoteColorKey.BLUE));
    expect(props.handleNoteSave).toHaveBeenCalledWith({ ...foldedNote, bgcolor: NoteColorKey.BLUE });

    openFoldedNoteContextMenu();
    act(() => lastContextMenuProps().onToggleTitleVisibility());
    expect(props.handleNoteSave).toHaveBeenCalledWith({ ...foldedNote, isTitleHidden: true });

    openFoldedNoteContextMenu();
    act(() => lastContextMenuProps().onOpenNoteWindow?.());
    expect(props.handleOpenNoteWindow).toHaveBeenCalledWith(foldedNote.id);

    openFoldedNoteContextMenu();
    act(() => lastContextMenuProps().onMoveNoteToTop());
    expect(props.handleMoveNoteToTop).toHaveBeenCalledWith(foldedNote.id);

    openFoldedNoteContextMenu();
    fireEvent.pointerDown(document);
    await waitFor(() => expect(screen.queryByTestId("note-context-menu")).not.toBeInTheDocument());
  });

  it("uses context-menu selection semantics for selected and unselected notes", async () => {
    const selectedProps = createProps({
      isSelectionMode: true,
      notes: [foldedNote],
      selectedNoteIds: new Set([foldedNote.id])
    });
    const { unmount } = render(<NoteList {...selectedProps} />);

    openFoldedNoteContextMenu();
    await waitFor(() => expect(screen.getByTestId("note-context-menu")).toBeInTheDocument());
    act(() => lastContextMenuProps().onSelectNote());
    expect(selectedProps.onDeselectNoteSelection).toHaveBeenCalledWith(foldedNote.id);
    unmount();

    const unselectedProps = createProps({ notes: [foldedNote] });
    render(<NoteList {...unselectedProps} />);
    openFoldedNoteContextMenu();
    await waitFor(() => expect(screen.getByTestId("note-context-menu")).toBeInTheDocument());
    act(() => lastContextMenuProps().onSelectNote());
    expect(unselectedProps.onSelectNoteSelection).toHaveBeenCalledWith(foldedNote.id);
  });
});

function createProps(overrides: Partial<ComponentProps<typeof NoteList>> = {}) {
  return {
    contentFontSize: 14,
    dateFormat: DateFormat.MonthDayYearSlash,
    handleDeleteNoteButton: vi.fn(),
    handleDuplicateNote: vi.fn(),
    handleMoveNoteToBottom: vi.fn(),
    handleMoveNoteToTop: vi.fn(),
    handleNoteReorder: vi.fn(),
    handleNoteSave: vi.fn(),
    handleOpenNoteWindow: vi.fn(),
    handleToggleNotePin: vi.fn(),
    isSelectionMode: false,
    noteFont: NoteFontPreference.SYSTEM,
    noteSize: NoteSizePreference.MEDIUM,
    notes: [foldedNote],
    onDeselectNoteSelection: vi.fn(),
    onEnterSelectionMode: vi.fn(),
    onSelectNoteSelection: vi.fn(),
    onToggleNoteSelection: vi.fn(),
    richTextEditorEnabled: true,
    selectedNoteIds: new Set<string>(),
    showFloatingFormatToolbar: false,
    dragAndDropSortingEnabled: true,
    showNoteFooters: true,
    showTitles: true,
    theme: SystemTheme.LIGHT,
    timeFormat: TimeFormat.Regular,
    titleFont: NoteFontPreference.SYSTEM,
    titleFontSize: 16,
    ...overrides
  };
}

function createNote(overrides: Partial<NoteType>): NoteType {
  return {
    bgcolor: NoteColorKey.YELLOW,
    content: "Note content",
    createdOn: new Date("2026-01-01T00:00:00.000Z"),
    id: "note",
    lastModifiedOn: new Date("2026-01-01T00:00:00.000Z"),
    title: "Note title",
    ...overrides
  };
}

function getDragIndicatorRow(container: HTMLElement): HTMLElement {
  const dragIndicatorRow = container.querySelector<HTMLElement>("div[aria-hidden='true']");

  if (!dragIndicatorRow) {
    throw new Error("Could not find the folded-note drag indicator.");
  }

  return dragIndicatorRow;
}

function lastDndContextProps(): Pick<DndContextProps, "onDragEnd" | "sensors"> {
  return captureDndContextProps.mock.calls.at(-1)?.[0] as Pick<DndContextProps, "onDragEnd" | "sensors">;
}

function lastNoteProps(): NoteProps {
  return captureNoteProps.mock.calls.at(-1)?.[0] as NoteProps;
}

function lastContextMenuProps(): ContextMenuProps {
  return captureContextMenuProps.mock.calls.at(-1)?.[0] as ContextMenuProps;
}

function openFoldedNoteContextMenu() {
  fireEvent.contextMenu(screen.getByText("First visible line"), { clientX: 20, clientY: 30 });
}
