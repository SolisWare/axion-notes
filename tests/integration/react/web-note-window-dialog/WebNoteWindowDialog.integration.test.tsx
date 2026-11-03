/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WebNoteWindowDialog from "../../../../src/components/WebNoteWindowDialog";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { NoteType } from "../../../../src/types/NoteType";
import { NotesChangeEvent } from "../../../../src/types/NotesChangeEvent";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const { translate } = vi.hoisted(() => ({
  translate: vi.fn((key: string) => key)
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

const initialNote: NoteType = {
  id: "web-note-window-dialog-note",
  bgcolor: "yellow",
  title: "Original title",
  content: "Original content",
  createdOn: new Date("2026-11-03T12:00:00.000Z"),
  lastModifiedOn: new Date("2026-11-03T12:00:00.000Z")
};

describe("WebNoteWindowDialog integration", () => {
  let emitNotesChange: ((event: NotesChangeEvent) => void) | undefined;

  beforeEach(() => {
    emitNotesChange = undefined;
    translate.mockClear();
    installDesktopApiMock({
      storage: {
        getNotes: vi.fn().mockResolvedValue([initialNote]),
        onNotesChange: vi.fn((callback) => {
          emitNotesChange = callback;

          return vi.fn();
        })
      }
    });
  });

  it("loads the requested note into the named modal dialog", async () => {
    renderWebNoteWindowDialog();

    await expect(screen.findByDisplayValue("Original title")).resolves.toBeVisible();
    expect(screen.getByPlaceholderText("typeHere")).toHaveValue("Original content");
    expect(screen.getByRole("dialog", { name: "note" })).toBeVisible();
  });

  it("updates the embedded note when a storage change event arrives", async () => {
    renderWebNoteWindowDialog();
    await screen.findByDisplayValue("Original title");

    act(() => {
      emitNotesChange?.({
        type: "setNote",
        note: {
          ...initialNote,
          title: "Updated title",
          content: "Updated content",
          lastModifiedOn: new Date("2026-11-03T12:01:00.000Z")
        }
      });
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Updated title")).toBeVisible();
      expect(screen.getByPlaceholderText("typeHere")).toHaveValue("Updated content");
    });
  });

  it("closes the dialog through the embedded note window control", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWebNoteWindowDialog({ onClose });
    await screen.findByDisplayValue("Original title");
    await user.click(screen.getByRole("button", { name: "close" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

function renderWebNoteWindowDialog(props?: Partial<ComponentProps<typeof WebNoteWindowDialog>>) {
  return render(
    <WebNoteWindowDialog
      appSettings={{
        ...defaultAppSettings,
        richTextEditorEnabled: false
      }}
      noteId={initialNote.id}
      open
      theme={SystemTheme.LIGHT}
      onClose={vi.fn()}
      onOpenNote={vi.fn()}
      {...props}
    />
  );
}
