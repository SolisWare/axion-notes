/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import NoteContextMenu from "../../../../src/components/NoteContextMenu";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { NoteColorKey } from "../../../../src/theme/NoteColors";
import { RichTextFormatCommand } from "../../../../src/types/RichTextFormatCommand";
import { getInactiveRichTextFormatState } from "../../../../src/types/RichTextFormatState";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      closeWindow: "Close window",
      deleteNote: "Delete note",
      duplicate: "Duplicate",
      format: "Format",
      note: "Note",
      noteColor: "Note color",
      "noteColors.yellow": "Yellow",
      "noteColors.blue": "Blue",
      "formatting.bold": "Bold"
    })[key] ?? key
  })
}));

describe("NoteContextMenu", () => {
  it("exposes a labelled menu with semantic actions and colour choices", () => {
    renderContextMenu();

    const menu = screen.getByRole("menu", { name: "Note" });
    expect(menu).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement).toBe(menu);
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete note" })).toBeInTheDocument();

    const colorGroup = screen.getByRole("radiogroup", { name: "Note color" });
    expect(colorGroup).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Yellow" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getAllByRole("radio")).toHaveLength(Object.values(NoteColorKey).length);
  });

  it("marks unavailable formatting as disabled", () => {
    renderContextMenu();

    expect(screen.getByRole("menuitem", { name: "Format" })).toHaveAttribute("aria-disabled", "true");
  });

  it("moves focus between top-level menu actions with the arrow keys", () => {
    renderContextMenu();

    const menu = screen.getByRole("menu", { name: "Note" });
    const menuItems = screen.getAllByRole("menuitem");
    fireEvent.keyDown(menu, { key: "ArrowDown" });

    expect(document.activeElement).toBe(menuItems[0]);
    fireEvent.keyDown(menuItems[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuItems[1]);
  });

  it("changes the selected colour with the arrow keys", () => {
    const onNoteColorChange = vi.fn();
    renderContextMenu({ onNoteColorChange });

    const yellow = screen.getByRole("radio", { name: "Yellow" });
    yellow.focus();
    fireEvent.keyDown(yellow, { key: "ArrowRight" });

    expect(onNoteColorChange).toHaveBeenCalledWith(Object.values(NoteColorKey)[1]);
    expect(document.activeElement).toHaveAttribute("data-note-color", Object.values(NoteColorKey)[1]);
  });

  it("opens the Format submenu and runs a keyboard-selected formatting command", () => {
    const onFormatAction = vi.fn();

    renderContextMenu({
      formatState: {
        ...getInactiveRichTextFormatState(),
        canFormat: true
      },
      onFormatAction
    });

    const formatItem = screen.getByRole("menuitem", { name: "Format" });
    fireEvent.keyDown(formatItem, { key: "Enter" });

    expect(formatItem).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "Bold" }), { key: "Enter" });

    expect(onFormatAction).toHaveBeenCalledWith(RichTextFormatCommand.BOLD);
  });

  it("shows and invokes Close window when supplied by a focused note window", () => {
    const onCloseWindow = vi.fn();

    renderContextMenu({ onCloseWindow });

    fireEvent.click(screen.getByText("Close window"));

    expect(onCloseWindow).toHaveBeenCalledOnce();
  });

  it("does not show Close window for notes on the main board", () => {
    renderContextMenu();

    expect(screen.queryByText("Close window")).not.toBeInTheDocument();
  });
});

function renderContextMenu(props?: Partial<ComponentProps<typeof NoteContextMenu>>) {
  return render(
    <NoteContextMenu
      theme={SystemTheme.LIGHT}
      position={{ mouseX: 100, mouseY: 100 }}
      selectedColor={NoteColorKey.YELLOW}
      isTitleHidden={false}
      isPinned={false}
      onDeleteNote={vi.fn()}
      onDuplicateNote={vi.fn()}
      onMoveNoteToBottom={vi.fn()}
      onMoveNoteToTop={vi.fn()}
      onNoteColorChange={vi.fn()}
      onToggleTitleVisibility={vi.fn()}
      {...props}
    />
  );
}
