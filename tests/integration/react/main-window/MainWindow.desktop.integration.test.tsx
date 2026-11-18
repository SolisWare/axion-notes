/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ComponentProps, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MainWindow from "../../../../src/views/MainWindow/MainWindow";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { NoteLayoutPreference } from "../../../../src/settings/NoteLayoutPreference";
import { NoteSortOrder } from "../../../../src/settings/noteSortOrder";
import { NoteColorKey } from "../../../../src/theme/NoteColors";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { NoteAccessStatus } from "../../../../src/types/NoteAccessStatus";
import { NotesChangeEvent } from "../../../../src/types/NotesChangeEvent";
import { NoteType } from "../../../../src/types/NoteType";
import { UserAgent } from "../../../../src/utils/UserAgent";
import { createDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const { captureHomeProps, captureSelectionToolbarProps, captureWebNoteWindowProps } = vi.hoisted(() => ({
  captureHomeProps: vi.fn(),
  captureSelectionToolbarProps: vi.fn(),
  captureWebNoteWindowProps: vi.fn()
}));

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("../../../../src/App", () => ({ AppView: { home: "/home", welcome: "/welcome" } }));
vi.mock("../../../../src/views/MainWindow/pages/Home", () => ({
  default: (props: HomeProps) => {
    captureHomeProps(props);
    return <div data-testid="home">{props.isLocked ? "locked" : props.notes.map((note) => note.title).join(",")}</div>;
  }
}));
vi.mock("../../../../src/components/NoteSelectionToolbar", () => ({
  default: (props: SelectionToolbarProps) => {
    captureSelectionToolbarProps(props);
    return <div data-testid="selection-toolbar">{props.selectedCount}</div>;
  }
}));
vi.mock("../../../../src/components/WebNoteWindowDialog", () => ({
  default: (props: WebNoteWindowProps) => {
    captureWebNoteWindowProps(props);
    return props.open ? <div data-testid="web-note-window">{props.noteId}</div> : null;
  }
}));

const firstNote = createNote({ id: "first", title: "First", createdOn: new Date("2026-01-01T00:00:00.000Z") });
const secondNote = createNote({ id: "second", title: "Second", createdOn: new Date("2026-01-02T00:00:00.000Z") });

type HomeProps = {
  notes: NoteType[];
  isLocked: boolean;
  isSelectionMode: boolean;
  selectedNoteIds: Set<string>;
  handleDeleteNoteButton: (noteId: string) => void;
  handleDuplicateNote: (note: NoteType) => void;
  handleOpenNoteWindow: (noteId: string) => void;
  handleMoveNoteToBottom: (noteId: string) => void;
  handleMoveNoteToTop: (noteId: string) => void;
  handleNoteReorder: (activeNoteId: string, overNoteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
  handleToggleNotePin: (note: NoteType) => void;
  onSelectNoteSelection: (noteId: string) => void;
};

type SelectionToolbarProps = {
  selectedCount: number;
  onDeleteSelectedNotes: () => void;
  onDuplicateSelectedNotes: () => void;
  onCancelSelection: () => void;
};

type WebNoteWindowProps = {
  noteId: string | null;
  open: boolean;
  onClose: () => void;
  onOpenNote: (noteId: string) => void;
};

describe("MainWindow desktop integration", () => {
  let emitLockStateChange: ((state: { isLocked: boolean }) => void) | undefined;
  let emitNotesChange: ((event: NotesChangeEvent) => void) | undefined;
  let menuNewNote: (() => void) | undefined;
  let menuSetLayout: ((layout: NoteLayoutPreference) => void) | undefined;
  let menuSetSortOrder: ((sortOrder: NoteSortOrder) => void) | undefined;
  let menuResort: (() => void) | undefined;
  let menuSelectAllNotes: (() => void) | undefined;
  let menuCancelNoteSelection: (() => void) | undefined;
  let desktopApi: ReturnType<typeof createDesktopApiMock>;

  beforeEach(() => {
    captureHomeProps.mockClear();
    captureSelectionToolbarProps.mockClear();
    captureWebNoteWindowProps.mockClear();
    UserAgent.isElectron = true;
    emitLockStateChange = undefined;
    emitNotesChange = undefined;
    menuNewNote = undefined;
    menuSetLayout = undefined;
    menuSetSortOrder = undefined;
    menuResort = undefined;
    menuSelectAllNotes = undefined;
    menuCancelNoteSelection = undefined;
    desktopApi = createDesktopApiMock({
      storage: {
        getNotesWithAccessState: vi.fn().mockResolvedValue({ status: NoteAccessStatus.AVAILABLE, notes: [secondNote, firstNote] }),
        onNotesChange: vi.fn((callback) => {
          emitNotesChange = callback;
          return vi.fn();
        })
      },
      security: {
        onLockStateChange: vi.fn((callback) => {
          emitLockStateChange = callback;
          return vi.fn();
        })
      },
      menu: {
        onMenuNewNote: vi.fn((callback) => {
          menuNewNote = callback;
          return vi.fn();
        }),
        onMenuSetNoteLayout: vi.fn((callback) => {
          menuSetLayout = callback;
          return vi.fn();
        }),
        onMenuSetNoteSortOrder: vi.fn((callback) => {
          menuSetSortOrder = callback;
          return vi.fn();
        }),
        onMenuResortNotes: vi.fn((callback) => {
          menuResort = callback;
          return vi.fn();
        }),
        onMenuSelectAllNotes: vi.fn((callback) => {
          menuSelectAllNotes = callback;
          return vi.fn();
        }),
        onMenuCancelNoteSelection: vi.fn((callback) => {
          menuCancelNoteSelection = callback;
          return vi.fn();
        })
      }
    });
    window.api = desktopApi;
  });

  afterEach(() => {
    UserAgent.isElectron = false;
  });

  it("loads notes, applies native menu changes, and opens note windows through Electron", async () => {
    const onAppSettingsChange = vi.fn();
    renderMainWindow({ onAppSettingsChange });

    await waitFor(() => expect(lastHomeProps().notes.map((note: NoteType) => note.id)).toEqual(["first", "second"]));
    act(() => menuSetLayout?.(NoteLayoutPreference.LIST));
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, noteLayout: NoteLayoutPreference.LIST });

    act(() => menuSetSortOrder?.(NoteSortOrder.TITLE_DESC));
    expect(onAppSettingsChange).toHaveBeenLastCalledWith({ ...defaultAppSettings, notesSortOrder: NoteSortOrder.TITLE_DESC });

    act(() => menuResort?.());
    expect(desktopApi.noteSort.requestSort).toHaveBeenCalledOnce();

    act(() => lastHomeProps().handleOpenNoteWindow(firstNote.id));
    expect(desktopApi.noteWindow.open).toHaveBeenCalledWith(firstNote.id, { offsetFromCurrentWindow: true });
  });

  it("updates notes from storage events and clears sensitive state as soon as the app locks", async () => {
    renderMainWindow();
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(2));

    const updatedNote = { ...firstNote, title: "Updated", lastModifiedOn: new Date("2026-01-03T00:00:00.000Z") };
    act(() => emitNotesChange?.({ type: "setNote", note: updatedNote }));
    await waitFor(() => expect(lastHomeProps().notes.find((note: NoteType) => note.id === firstNote.id)?.title).toBe("Updated"));

    act(() => emitNotesChange?.({ type: "setNoteOrder", noteIds: ["second", "first"] }));
    await waitFor(() => expect(lastHomeProps().notes.map((note: NoteType) => note.id)).toEqual(["second", "first"]));

    act(() => emitLockStateChange?.({ isLocked: true }));
    await waitFor(() => {
      expect(lastHomeProps().isLocked).toBe(true);
      expect(lastHomeProps().notes).toEqual([]);
    });

    act(() => emitNotesChange?.({ type: "setNote", note: firstNote }));
    expect(lastHomeProps().notes).toEqual([]);
  });

  it("updates note storage and ordering through Home actions", async () => {
    const onAppSettingsChange = vi.fn();
    renderMainWindow({ onAppSettingsChange });
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(2));

    const savedNote = { ...firstNote, title: "Saved" };
    act(() => lastHomeProps().handleNoteSave(savedNote));
    expect(desktopApi.storage.setNote).toHaveBeenCalledWith(savedNote);
    await waitFor(() => expect(lastHomeProps().notes.find((note) => note.id === firstNote.id)?.title).toBe("Saved"));

    act(() => lastHomeProps().handleNoteReorder(secondNote.id, firstNote.id));
    await waitFor(() => expect(desktopApi.storage.setNoteOrder).toHaveBeenLastCalledWith(["second", "first"]));
    expect(onAppSettingsChange).toHaveBeenCalledWith({ ...defaultAppSettings, notesSortOrder: NoteSortOrder.CUSTOM });

    act(() => lastHomeProps().handleMoveNoteToTop(firstNote.id));
    await waitFor(() => expect(desktopApi.storage.setNoteOrder).toHaveBeenLastCalledWith(["first", "second"]));

    act(() => lastHomeProps().handleToggleNotePin(firstNote));
    await waitFor(() => {
      expect(desktopApi.storage.setNote).toHaveBeenCalledWith(expect.objectContaining({ id: firstNote.id, pinnedOn: expect.any(Date) }));
      expect(desktopApi.storage.setNoteOrder).toHaveBeenLastCalledWith(["first", "second"]);
    });

    act(() => lastHomeProps().handleDeleteNoteButton(secondNote.id));
    expect(desktopApi.storage.deleteNote).toHaveBeenCalledWith(secondNote.id);
    await waitFor(() => expect(lastHomeProps().notes.map((note) => note.id)).toEqual(["first"]));
  });

  it("keeps native selection state synchronized and duplicates selected notes", async () => {
    renderMainWindow();
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(2));

    act(() => menuNewNote?.());
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(3));

    act(() => menuSelectAllNotes?.());
    await waitFor(() => {
      expect(screen.getByTestId("selection-toolbar")).toHaveTextContent("3");
      expect(desktopApi.menu.setNoteSelectionState).toHaveBeenLastCalledWith({
        hasNotes: true,
        isSelectionMode: true,
        areAllNotesSelected: true
      });
    });

    act(() => captureSelectionToolbarProps.mock.calls.at(-1)?.[0].onDuplicateSelectedNotes());
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(6));
    expect(desktopApi.storage.setNote).toHaveBeenCalledTimes(3);

    act(() => menuCancelNoteSelection?.());
    await waitFor(() => expect(screen.queryByTestId("selection-toolbar")).not.toBeInTheDocument());
  });

  it("applies desktop window and note-title settings changes", async () => {
    const initialSettings = {
      ...defaultAppSettings,
      keepNotesMainWindowOnTop: false,
      noteLayout: NoteLayoutPreference.GRID,
      showTitles: true
    };
    const { rerender } = renderMainWindow({ appSettings: initialSettings });
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(2));

    expect(desktopApi.appWindow.setAlwaysOnTop).toHaveBeenCalledWith(false);
    rerenderMainWindow(rerender, {
      ...initialSettings,
      keepNotesMainWindowOnTop: true,
      noteLayout: NoteLayoutPreference.LIST,
      showTitles: false
    });

    await waitFor(() => {
      expect(desktopApi.appWindow.setAlwaysOnTop).toHaveBeenLastCalledWith(true);
      expect(desktopApi.appWindow.setLayout).toHaveBeenCalledWith(NoteLayoutPreference.LIST);
      expect(desktopApi.storage.setNote).toHaveBeenCalledWith(expect.objectContaining({ id: firstNote.id, isTitleHidden: true }));
      expect(desktopApi.storage.setNote).toHaveBeenCalledWith(expect.objectContaining({ id: secondNote.id, isTitleHidden: true }));
    });
  });

  it("supports keyboard selection shortcuts and preserves their two-step Escape behavior", async () => {
    renderMainWindow();
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(2));

    fireEvent.keyDown(document, { key: "a", ctrlKey: true, shiftKey: true });
    await waitFor(() => expect(screen.getByTestId("selection-toolbar")).toHaveTextContent("0"));

    fireEvent.keyDown(document, { key: "a", ctrlKey: true });
    await waitFor(() => expect(screen.getByTestId("selection-toolbar")).toHaveTextContent("2"));

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.getByTestId("selection-toolbar")).toHaveTextContent("0"));

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByTestId("selection-toolbar")).not.toBeInTheDocument());
  });

  it("duplicates individual notes beside their source and can delete selected notes", async () => {
    renderMainWindow();
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(2));

    act(() => lastHomeProps().handleDuplicateNote(firstNote));
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(3));
    expect(lastHomeProps().notes[0].id).toBe(firstNote.id);
    expect(lastHomeProps().notes[1]).toEqual(expect.objectContaining({ title: firstNote.title, id: expect.any(String) }));
    expect(lastHomeProps().notes[1].id).not.toBe(firstNote.id);

    const duplicateId = lastHomeProps().notes[1].id;
    act(() => lastHomeProps().onSelectNoteSelection(duplicateId));
    await waitFor(() => expect(screen.getByTestId("selection-toolbar")).toHaveTextContent("1"));

    act(() => captureSelectionToolbarProps.mock.calls.at(-1)?.[0].onDeleteSelectedNotes());
    await waitFor(() => expect(screen.getByRole("dialog", { name: "deleteSelectedNotes" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "delete" }));

    await waitFor(() => expect(lastHomeProps().notes.map((note) => note.id)).not.toContain(duplicateId));
    expect(desktopApi.storage.deleteNote).toHaveBeenCalledWith(duplicateId);
  });

  it("keeps browser note windows single-instance and switches the active note", async () => {
    UserAgent.isElectron = false;
    renderMainWindow();
    await waitFor(() => expect(lastHomeProps().notes).toHaveLength(2));

    act(() => lastHomeProps().handleOpenNoteWindow(firstNote.id));
    await waitFor(() => expect(screen.getByTestId("web-note-window")).toHaveTextContent(firstNote.id));

    act(() => captureWebNoteWindowProps.mock.calls.at(-1)?.[0].onOpenNote(secondNote.id));
    await waitFor(() => expect(screen.getByTestId("web-note-window")).toHaveTextContent(secondNote.id));

    act(() => captureWebNoteWindowProps.mock.calls.at(-1)?.[0].onClose());
    await waitFor(() => expect(screen.queryByTestId("web-note-window")).not.toBeInTheDocument());
    expect(desktopApi.noteWindow.open).not.toHaveBeenCalled();
  });
});

function renderMainWindow(overrides: Partial<ComponentProps<typeof MainWindow>> = {}) {
  return render(
    createMainWindowElement(overrides)
  );
}

function rerenderMainWindow(rerender: (ui: ReactNode) => void, appSettings: ComponentProps<typeof MainWindow>["appSettings"]) {
  rerender(createMainWindowElement({ appSettings }));
}

function createMainWindowElement(overrides: Partial<ComponentProps<typeof MainWindow>>) {
  return (
    <MemoryRouter initialEntries={["/home"]}>
      <MainWindow
          appSettings={defaultAppSettings}
          onAppSettingsChange={vi.fn()}
          theme={SystemTheme.LIGHT}
          view={"/home" as never}
          {...overrides}
      />
    </MemoryRouter>
  );
}

function lastHomeProps(): HomeProps {
  const props = captureHomeProps.mock.calls.at(-1)?.[0] as HomeProps | undefined;

  if (!props) {
    throw new Error("Home was not rendered.");
  }

  return props;
}

function createNote(overrides: Partial<NoteType>): NoteType {
  return {
    id: "note",
    bgcolor: NoteColorKey.YELLOW,
    title: "Note",
    content: "",
    createdOn: new Date(),
    lastModifiedOn: new Date(),
    ...overrides
  };
}
