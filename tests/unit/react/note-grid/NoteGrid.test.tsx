/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { act, render } from "@testing-library/react";
import { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NoteGrid from "../../../../src/components/NoteGrid";
import { NoteFontPreference } from "../../../../src/settings/NoteFontPreference";
import { NoteSizePreference } from "../../../../src/settings/noteSizePreference";
import { NoteColorKey } from "../../../../src/theme/NoteColors";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { NoteType } from "../../../../src/types/NoteType";
import { DateFormat } from "../../../../src/utils/dt-formatter/DateFormat";
import { TimeFormat } from "../../../../src/utils/dt-formatter/TimeFormat";

type DragEndHandler = (event: { active: { id: string }; over: { id: string } | null }) => void;

type DndContextProps = {
  children: ReactNode;
  onDragEnd: DragEndHandler;
  sensors: unknown[];
};

const { captureDndContextProps, captureSortableNoteProps, useSensor, useSensors } = vi.hoisted(() => ({
  captureDndContextProps: vi.fn(),
  captureSortableNoteProps: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn()
}));

vi.mock("@dnd-kit/core", () => ({
  closestCenter: vi.fn(),
  DndContext: ({ children, ...props }: DndContextProps) => {
    captureDndContextProps(props);
    return <div>{children}</div>;
  },
  PointerSensor: class {},
  useSensor,
  useSensors
}));
vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  rectSortingStrategy: vi.fn()
}));
vi.mock("../../../../src/components/SortableNote", () => ({
  default: (props: { dragAndDropSortingEnabled: boolean; note: NoteType }) => {
    captureSortableNoteProps(props);
    return <div>{props.note.title}</div>;
  }
}));

describe("NoteGrid", () => {
  beforeEach(() => {
    captureDndContextProps.mockClear();
    captureSortableNoteProps.mockClear();
    useSensor.mockImplementation((_sensor, options) => ({ options, sensor: "pointer" }));
    useSensors.mockImplementation((...sensors) => sensors);
  });

  it("disables sortable notes and reorder callbacks when manual sorting is disabled", () => {
    const props = createProps({ dragAndDropSortingEnabled: false });
    render(<NoteGrid {...props} />);

    expect(lastDndContextProps().sensors).toEqual([expect.objectContaining({ sensor: "pointer" })]);
    expect(captureSortableNoteProps).toHaveBeenCalledWith(expect.objectContaining({ dragAndDropSortingEnabled: false }));
    expect(useSensor).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ enabled: false }));

    act(() => lastDndContextProps().onDragEnd({ active: { id: "note-1" }, over: { id: "note-2" } }));
    expect(props.handleNoteReorder).not.toHaveBeenCalled();
  });

  it("reorders a note after an enabled drag completes over another note", () => {
    const props = createProps();
    render(<NoteGrid {...props} />);

    expect(lastDndContextProps().sensors).toEqual([expect.objectContaining({ sensor: "pointer" })]);
    expect(useSensor).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ enabled: true }));
    act(() => lastDndContextProps().onDragEnd({ active: { id: "note-1" }, over: { id: "note-2" } }));

    expect(props.handleNoteReorder).toHaveBeenCalledWith("note-1", "note-2");
  });
});

function createProps(overrides: Partial<ComponentProps<typeof NoteGrid>> = {}) {
  return {
    contentFontSize: 14,
    dateFormat: DateFormat.MonthDayYearSlash,
    dragAndDropSortingEnabled: true,
    handleDeleteNoteButton: vi.fn(),
    handleDuplicateNote: vi.fn(),
    handleMoveNoteToBottom: vi.fn(),
    handleMoveNoteToTop: vi.fn(),
    handleNoteReorder: vi.fn(),
    handleNoteSave: vi.fn(),
    handleToggleNotePin: vi.fn(),
    isSelectionMode: false,
    noteFont: NoteFontPreference.SYSTEM,
    noteSize: NoteSizePreference.DEFAULT,
    notes: [createNote("note-1"), createNote("note-2")],
    onDeselectNoteSelection: vi.fn(),
    onEnterSelectionMode: vi.fn(),
    onSelectNoteSelection: vi.fn(),
    onToggleNoteSelection: vi.fn(),
    richTextEditorEnabled: true,
    selectedNoteIds: new Set<string>(),
    showFloatingFormatToolbar: true,
    showNoteFooters: true,
    showTitles: true,
    theme: SystemTheme.LIGHT,
    timeFormat: TimeFormat.Regular,
    titleFont: NoteFontPreference.SYSTEM,
    titleFontSize: 17,
    ...overrides
  };
}

function createNote(id: string): NoteType {
  return {
    bgcolor: NoteColorKey.YELLOW,
    content: "Note content",
    createdOn: new Date("2026-01-01T00:00:00.000Z"),
    id,
    lastModifiedOn: new Date("2026-01-01T00:00:00.000Z"),
    title: id
  };
}

function lastDndContextProps(): Pick<DndContextProps, "onDragEnd" | "sensors"> {
  return captureDndContextProps.mock.calls.at(-1)?.[0] as Pick<DndContextProps, "onDragEnd" | "sensors">;
}
