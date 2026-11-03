/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import WebNoteWindowDialog from "../../../../src/components/WebNoteWindowDialog";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const { noteWindow } = vi.hoisted(() => ({
  noteWindow: vi.fn()
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key === "note" ? "Note" : key
  })
}));

vi.mock("../../../../src/views/NoteWindow/NoteWindow", () => ({
  default: (props: { noteId: string }) => {
    noteWindow(props);

    return <div>Embedded note: {props.noteId}</div>;
  }
}));

describe("WebNoteWindowDialog accessibility", () => {
  it("does not expose an empty dialog without a note ID", () => {
    renderWebNoteWindowDialog({ noteId: null, open: true });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(noteWindow).not.toHaveBeenCalled();
  });

  it("exposes an open note window as a named modal dialog", () => {
    renderWebNoteWindowDialog({ noteId: "note-1", open: true });

    expect(screen.getByRole("dialog", { name: "Note" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Embedded note: note-1")).toBeInTheDocument();
  });
});

function renderWebNoteWindowDialog(props?: Partial<ComponentProps<typeof WebNoteWindowDialog>>) {
  noteWindow.mockClear();

  return render(
    <WebNoteWindowDialog
      appSettings={defaultAppSettings}
      noteId="note-1"
      open
      theme={SystemTheme.LIGHT}
      onClose={vi.fn()}
      onOpenNote={vi.fn()}
      {...props}
    />
  );
}
