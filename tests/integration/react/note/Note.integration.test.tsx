/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  format: "Format",
  "formatting.bold": "Bold",
  title: "Title",
  typeHere: "Type here"
})[key] ?? key);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate })
}));

describe("Note integration", () => {
  beforeEach(() => {
    installDesktopApiMock();
    translate.mockClear();
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: () => document.body
    });
  });

  it("applies floating-toolbar formatting and saves the rich-text document", async () => {
    const user = userEvent.setup();
    const handleNoteSave = vi.fn();

    renderNote({ handleNoteSave });

    const editor = document.querySelector<HTMLElement>(".ProseMirror");
    if (!editor) {
      throw new Error("Could not find the rich-text editor.");
    }

    await user.click(editor);
    await user.keyboard("{Control>}a{/Control}");
    await user.click(screen.getByRole("button", { name: "Format" }));
    await user.click(screen.getByRole("button", { name: "Bold" }));

    await waitFor(() => {
      expect(handleNoteSave).toHaveBeenLastCalledWith(expect.objectContaining({
        content: "Integration note",
        richContent: expect.objectContaining({ type: "doc" })
      }));
    });
    expect(editor.querySelector("strong")).toHaveTextContent("Integration note");
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
      richTextEditorEnabled
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
    content: "Integration note",
    title: "Integration title",
    createdOn: new Date("2026-11-08T12:00:00.000Z"),
    lastModifiedOn: new Date("2026-11-08T12:00:00.000Z"),
    ...overrides
  };
}
