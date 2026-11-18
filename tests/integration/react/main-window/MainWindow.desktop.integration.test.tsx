/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { act, render, waitFor } from "@testing-library/react";
import { ComponentProps } from "react";
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

const { captureHomeProps } = vi.hoisted(() => ({ captureHomeProps: vi.fn() }));

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("../../../../src/App", () => ({ AppView: { home: "/home", welcome: "/welcome" } }));
vi.mock("../../../../src/views/MainWindow/pages/Home", () => ({
  default: (props: HomeProps) => {
    captureHomeProps(props);
    return <div data-testid="home">{props.isLocked ? "locked" : props.notes.map((note) => note.title).join(",")}</div>;
  }
}));

const firstNote = createNote({ id: "first", title: "First", createdOn: new Date("2026-01-01T00:00:00.000Z") });
const secondNote = createNote({ id: "second", title: "Second", createdOn: new Date("2026-01-02T00:00:00.000Z") });

type HomeProps = {
  notes: NoteType[];
  isLocked: boolean;
  handleOpenNoteWindow: (noteId: string) => void;
};

describe("MainWindow desktop integration", () => {
  let emitLockStateChange: ((state: { isLocked: boolean }) => void) | undefined;
  let emitNotesChange: ((event: NotesChangeEvent) => void) | undefined;
  let menuSetLayout: ((layout: NoteLayoutPreference) => void) | undefined;
  let menuSetSortOrder: ((sortOrder: NoteSortOrder) => void) | undefined;
  let menuResort: (() => void) | undefined;
  let desktopApi: ReturnType<typeof createDesktopApiMock>;

  beforeEach(() => {
    captureHomeProps.mockClear();
    UserAgent.isElectron = true;
    emitLockStateChange = undefined;
    emitNotesChange = undefined;
    menuSetLayout = undefined;
    menuSetSortOrder = undefined;
    menuResort = undefined;
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
});

function renderMainWindow(overrides: Partial<ComponentProps<typeof MainWindow>> = {}) {
  return render(
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
