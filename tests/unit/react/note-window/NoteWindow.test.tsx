/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NoteWindow from "../../../../src/views/NoteWindow/NoteWindow";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { NoteType } from "../../../../src/types/NoteType";
import { NotesChangeEvent } from "../../../../src/types/NotesChangeEvent";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { createDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const { generateId, renderNote } = vi.hoisted(() => ({
  generateId: vi.fn(() => "duplicated-note"),
  renderNote: vi.fn()
}));

vi.mock("nanoid", () => ({ nanoid: generateId }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key === "close" ? "Close" : key })
}));
vi.mock("../../../../src/components/Note", () => ({
  default: (props: { note: NoteType }) => {
    renderNote(props);

    return <div data-testid="note">{props.note.title}</div>;
  }
}));

const initialNote: NoteType = {
  id: "note-window-note",
  bgcolor: "yellow",
  title: "Original title",
  content: "Original content",
  createdOn: new Date("2026-11-10T12:00:00.000Z"),
  lastModifiedOn: new Date("2026-11-10T12:00:00.000Z")
};

describe("NoteWindow", () => {
  let emitNotesChange: ((event: NotesChangeEvent) => void) | undefined;
  let desktopApi: ReturnType<typeof createDesktopApiMock>;

  beforeEach(() => {
    emitNotesChange = undefined;
    renderNote.mockClear();
    desktopApi = createDesktopApiMock({
      storage: {
        getNotes: vi.fn().mockResolvedValue([initialNote]),
        onNotesChange: vi.fn((callback) => {
          emitNotesChange = callback;

          return vi.fn();
        })
      }
    });
    window.api = desktopApi;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not load or render a note when no note ID is available", () => {
    render(<NoteWindow appSettings={defaultAppSettings} noteId={null} theme={SystemTheme.LIGHT} />);

    expect(desktopApi.storage.getNotes).not.toHaveBeenCalled();
    expect(renderNote).not.toHaveBeenCalled();
  });

  it("loads the requested note, supplies the editor configuration, and exposes the embedded close control", async () => {
    const onClose = vi.fn();
    render(<NoteWindow appSettings={defaultAppSettings} embedded noteId={initialNote.id} theme={SystemTheme.DARK} onClose={onClose} />);

    await screen.findByTestId("note");
    const noteProps = lastRenderedNoteProps();
    expect(noteProps).toMatchObject({
      note: initialNote,
      noteSize: "default",
      showFormatToolbar: true,
      showWordCharacterCount: true,
      reserveCloseButtonSpace: true
    });
    expect(noteProps.onCloseWindow).toBeUndefined();

    await act(async () => screen.getByRole("button", { name: "Close" }).click());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the displayed note synchronized with relevant storage events", async () => {
    render(<NoteWindow appSettings={defaultAppSettings} noteId={initialNote.id} theme={SystemTheme.LIGHT} />);
    await screen.findByTestId("note");

    act(() => {
      emitNotesChange?.({
        type: "setNote",
        note: {
          ...initialNote,
          title: "Updated title",
          createdOn: "2026-11-10T12:05:00.000Z" as never,
          lastModifiedOn: "2026-11-10T12:06:00.000Z" as never,
          pinnedOn: "2026-11-10T12:07:00.000Z" as never
        }
      });
    });

    await waitFor(() => expect(screen.getByTestId("note")).toHaveTextContent("Updated title"));
    expect(lastRenderedNoteProps().note.createdOn).toBeInstanceOf(Date);
    expect(lastRenderedNoteProps().note.pinnedOn).toBeInstanceOf(Date);

    act(() => emitNotesChange?.({ type: "deleteNote", noteId: initialNote.id }));
    await waitFor(() => expect(screen.queryByTestId("note")).not.toBeInTheDocument());
  });

  it("does not render an unavailable note and safely handles unrelated and global storage events", async () => {
    desktopApi.storage.getNotes = vi.fn().mockResolvedValue([]);
    render(<NoteWindow appSettings={defaultAppSettings} noteId={initialNote.id} theme={SystemTheme.LIGHT} />);

    await waitFor(() => expect(desktopApi.storage.getNotes).toHaveBeenCalledOnce());
    expect(screen.queryByTestId("note")).not.toBeInTheDocument();

    act(() => emitNotesChange?.({ type: "setNote", note: { ...initialNote, id: "other-note" } }));
    expect(screen.queryByTestId("note")).not.toBeInTheDocument();
    act(() => emitNotesChange?.({ type: "deleteNote", noteId: "other-note" }));
    act(() => emitNotesChange?.({ type: "setNoteOrder", noteIds: [initialNote.id] }));
    act(() => emitNotesChange?.({ type: "deleteAllNotes" }));
    expect(screen.queryByTestId("note")).not.toBeInTheDocument();
  });

  it("saves, deletes, duplicates, and pins the loaded note through storage", async () => {
    const onClose = vi.fn();
    const onOpenNote = vi.fn();
    render(<NoteWindow appSettings={defaultAppSettings} noteId={initialNote.id} theme={SystemTheme.LIGHT} onClose={onClose} onOpenNote={onOpenNote} />);
    await screen.findByTestId("note");
    const noteProps = lastRenderedNoteProps();

    const editedNote = { ...initialNote, title: "Edited title" };
    act(() => noteProps.handleNoteSave(editedNote));
    expect(desktopApi.storage.setNote).toHaveBeenCalledWith(editedNote);

    act(() => noteProps.handleDuplicateNote(initialNote));
    expect(generateId).toHaveBeenCalledOnce();
    expect(desktopApi.storage.setNote).toHaveBeenCalledWith(expect.objectContaining({ id: "duplicated-note", title: initialNote.title }));
    expect(onOpenNote).toHaveBeenCalledWith("duplicated-note");

    act(() => noteProps.handleToggleNotePin(initialNote));
    await waitFor(() => expect(desktopApi.storage.setNoteOrder).toHaveBeenCalledWith([initialNote.id]));
    expect(desktopApi.storage.setNote).toHaveBeenLastCalledWith(expect.objectContaining({ id: initialNote.id, pinnedOn: expect.any(Date) }));

    act(() => noteProps.handleDeleteNoteButton(initialNote.id));
    expect(desktopApi.storage.deleteNote).toHaveBeenCalledWith(initialNote.id);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses desktop window APIs when no embedded callbacks are supplied", async () => {
    render(<NoteWindow appSettings={defaultAppSettings} noteId={initialNote.id} theme={SystemTheme.LIGHT} />);
    await screen.findByTestId("note");
    const noteProps = lastRenderedNoteProps();

    act(() => noteProps.onCloseWindow());
    expect(desktopApi.appWindow.close).toHaveBeenCalledOnce();

    act(() => noteProps.handleDuplicateNote(initialNote));
    expect(desktopApi.noteWindow.open).toHaveBeenCalledWith("duplicated-note", { offsetFromCurrentWindow: true });
  });

  it("unpinns a pinned stored note and persists its updated order", async () => {
    const pinnedNote = { ...initialNote, isPinned: true, pinnedOn: new Date("2026-11-10T12:01:00.000Z") };
    desktopApi.storage.getNotes = vi.fn().mockResolvedValue([pinnedNote]);
    render(<NoteWindow appSettings={defaultAppSettings} noteId={pinnedNote.id} theme={SystemTheme.LIGHT} />);
    await screen.findByTestId("note");

    act(() => lastRenderedNoteProps().handleToggleNotePin(pinnedNote));

    await waitFor(() => expect(desktopApi.storage.setNoteOrder).toHaveBeenCalledWith([pinnedNote.id]));
    expect(desktopApi.storage.setNote).toHaveBeenLastCalledWith(expect.objectContaining({ id: pinnedNote.id, pinnedOn: undefined }));
  });
});

function lastRenderedNoteProps(): Record<string, any> {
  return renderNote.mock.calls.at(-1)?.[0] as Record<string, any>;
}
