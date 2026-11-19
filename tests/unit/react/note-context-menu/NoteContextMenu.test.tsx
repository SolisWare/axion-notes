/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
      foldNote: "Fold note",
      hideTitle: "Hide title",
      note: "Note",
      noteColor: "Note color",
      "noteColors.yellow": "Yellow",
      "noteColors.blue": "Blue",
      openInNewWindow: "Open in new window",
      pinNote: "Pin note",
      selectNote: "Select note",
      unpinNote: "Unpin note",
      deselectNote: "Deselect note",
      unfoldNote: "Unfold note",
      showTitle: "Show title",
      "formatting.bold": "Bold",
      "formatting.clearFormatting": "Clear formatting",
      "formatting.font": "Font",
      "formatting.fontSize": "Font size"
    })[key] ?? key
  })
}));

const initialInnerWidth = window.innerWidth;
const initialInnerHeight = window.innerHeight;

describe("NoteContextMenu", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: initialInnerWidth });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: initialInnerHeight });
  });

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

  it("routes note actions and selected colours to their supplied callbacks", () => {
    const callbacks = {
      onDuplicateNote: vi.fn(),
      onMoveNoteToBottom: vi.fn(),
      onMoveNoteToTop: vi.fn(),
      onNoteColorChange: vi.fn(),
      onOpenNoteWindow: vi.fn(),
      onSelectNote: vi.fn(),
      onToggleFold: vi.fn(),
      onTogglePin: vi.fn(),
      onToggleTitleVisibility: vi.fn()
    };
    renderContextMenu({ isFolded: false, ...callbacks });

    fireEvent.click(screen.getByRole("menuitem", { name: "Pin note" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Select note" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Open in new window" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Fold note" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "moveNoteToTop" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "moveNoteToBottom" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Hide title" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete note" }));
    fireEvent.click(screen.getAllByRole("radio")[1]);

    expect(callbacks.onTogglePin).toHaveBeenCalledOnce();
    expect(callbacks.onSelectNote).toHaveBeenCalledOnce();
    expect(callbacks.onOpenNoteWindow).toHaveBeenCalledOnce();
    expect(callbacks.onToggleFold).toHaveBeenCalledOnce();
    expect(callbacks.onMoveNoteToTop).toHaveBeenCalledOnce();
    expect(callbacks.onMoveNoteToBottom).toHaveBeenCalledOnce();
    expect(callbacks.onDuplicateNote).toHaveBeenCalledOnce();
    expect(callbacks.onToggleTitleVisibility).toHaveBeenCalledOnce();
    expect(callbacks.onNoteColorChange).toHaveBeenCalledWith(Object.values(NoteColorKey)[1]);
  });

  it("opens nested format menus and sends font size, font family, and clear-format commands", () => {
    const onFormatAction = vi.fn();
    renderContextMenu({
      formatState: { ...getInactiveRichTextFormatState(), canFormat: true },
      onFormatAction
    });

    fireEvent.click(screen.getByRole("menuitem", { name: "Format" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Font size" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "20" }));
    expect(onFormatAction).toHaveBeenCalledWith({ command: RichTextFormatCommand.FONT_SIZE, fontSize: 20 });

    fireEvent.click(screen.getByRole("menuitem", { name: "Font" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "fonts.serif" }));
    expect(onFormatAction).toHaveBeenCalledWith({ command: RichTextFormatCommand.FONT_FAMILY, noteFont: "serif" });

    fireEvent.click(screen.getByRole("menuitem", { name: "Clear formatting" }));
    expect(onFormatAction).toHaveBeenCalledWith(RichTextFormatCommand.CLEAR_FORMATTING);
  });

  it("keeps formatting disabled until both state and an action handler are available", () => {
    const { rerender } = renderContextMenu({ formatState: { ...getInactiveRichTextFormatState(), canFormat: true } });
    expect(screen.getByRole("menuitem", { name: "Format" })).toHaveAttribute("aria-disabled", "true");

    rerender(
      <NoteContextMenu
        {...createContextMenuProps()}
        formatState={{ ...getInactiveRichTextFormatState(), canFormat: true }}
        onFormatAction={vi.fn()}
      />
    );
    expect(screen.getByRole("menuitem", { name: "Format" })).toHaveAttribute("aria-disabled", "false");
  });

  it("closes open submenus after the pointer-leave grace period and immediately on menu scroll", () => {
    vi.useFakeTimers();
    renderContextMenu({
      formatState: { ...getInactiveRichTextFormatState(), canFormat: true },
      onFormatAction: vi.fn()
    });
    const format = screen.getByRole("menuitem", { name: "Format" });

    fireEvent.pointerEnter(format);
    expect(format).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerLeave(format);
    act(() => vi.advanceTimersByTime(320));
    expect(format).toHaveAttribute("aria-expanded", "false");

    fireEvent.pointerEnter(format);
    expect(format).toHaveAttribute("aria-expanded", "true");
    fireEvent.scroll(screen.getByRole("menu", { name: "Note" }));
    expect(format).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the menu within the viewport when opened near its lower-right edge", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 150 });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 80,
      height: 80,
      left: 0,
      right: 120,
      top: 0,
      width: 120,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    renderContextMenu({ position: { mouseX: 195, mouseY: 145 } });

    const menu = screen.getByRole("menu", { name: "Note" });
    expect(menu).toHaveStyle({ left: "75px", top: "65px" });
  });

  it("reflects selected note state in optional action labels and can hide optional actions", () => {
    renderContextMenu({
      isFolded: true,
      isPinned: true,
      isSelected: true,
      isSelectionMode: true,
      isTitleHidden: true,
      onSelectNote: vi.fn(),
      onToggleFold: vi.fn(),
      onTogglePin: vi.fn(),
      showMoveActions: false,
      showTitleVisibilityAction: false
    });

    expect(screen.getByRole("menuitem", { name: "Unpin note" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Deselect note" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Unfold note" })).toBeInTheDocument();
    expect(screen.queryByText("moveNoteToTop")).not.toBeInTheDocument();
    expect(screen.queryByText("Show title")).not.toBeInTheDocument();
  });

  it("updates the colour label on hover and suppresses the browser context menu", () => {
    renderContextMenu();
    const menu = screen.getByRole("menu", { name: "Note" });
    const secondColor = screen.getAllByRole("radio")[1];

    fireEvent.mouseEnter(secondColor);
    expect(screen.getByText(`noteColors.${Object.values(NoteColorKey)[1]}`)).toBeInTheDocument();
    fireEvent.mouseLeave(secondColor.parentElement as HTMLElement);
    expect(screen.getByText("Note color...")).toBeInTheDocument();

    const contextMenuEvent = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    menu.dispatchEvent(contextMenuEvent);
    expect(contextMenuEvent.defaultPrevented).toBe(true);
  });
});

function renderContextMenu(props?: Partial<ComponentProps<typeof NoteContextMenu>>) {
  return render(
    <NoteContextMenu {...createContextMenuProps()} {...props} />
  );
}

function createContextMenuProps(): ComponentProps<typeof NoteContextMenu> {
  return {
    theme: SystemTheme.LIGHT,
    position: { mouseX: 100, mouseY: 100 },
    selectedColor: NoteColorKey.YELLOW,
    isTitleHidden: false,
    isPinned: false,
    onDeleteNote: vi.fn(),
    onDuplicateNote: vi.fn(),
    onMoveNoteToBottom: vi.fn(),
    onMoveNoteToTop: vi.fn(),
    onNoteColorChange: vi.fn(),
    onToggleTitleVisibility: vi.fn()
  };
}
