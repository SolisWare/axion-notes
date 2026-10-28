/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NoteFormatToolbar from "../../../../src/components/NoteFormatToolbar";
import { RichTextFormatCommand } from "../../../../src/models/RichTextFormatCommand";
import { getInactiveRichTextFormatState, RichTextFormatState } from "../../../../src/models/RichTextFormatState";
import { NoteFontPreference } from "../../../../src/settings/NoteFontPreference";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const { translations, translate } = vi.hoisted(() => {
  const translations: Record<string, string> = {
    format: "Format",
    multiple: "Multiple",
    "formatting.bold": "Bold",
    "formatting.italic": "Italic",
    "formatting.underline": "Underline",
    "formatting.strikethrough": "Strikethrough",
    "formatting.highlight": "Highlight",
    "formatting.inlineCode": "Inline code",
    "formatting.lists": "Lists",
    "formatting.bulletList": "Bullet list",
    "formatting.dashedList": "Dashed list",
    "formatting.numberedList": "Numbered list",
    "formatting.checklist": "Checklist",
    "formatting.superscript": "Superscript",
    "formatting.subscript": "Subscript",
    "formatting.fontSize": "Font size",
    "formatting.font": "Font",
    "formatting.clearFormatting": "Clear formatting",
    "fonts.system": "System",
    "fonts.serif": "Serif",
    "fonts.sansSerif": "Sans serif",
    "fonts.monospace": "Monospace",
    "fonts.inter": "Inter",
    "fonts.sourceSans3": "Source Sans 3",
    "fonts.lora": "Lora",
    "fonts.sourceSerif4": "Source Serif 4",
    "fonts.spaceMono": "Space Mono",
    "fonts.caveat": "Caveat",
    "fonts.dancingScript": "Dancing Script",
    "fontCategories.generic": "Generic",
    "fontCategories.standard": "Standard",
    "fontCategories.typewriter": "Typewriter",
    "fontCategories.handwriting": "Handwriting",
    "fontCategories.calligraphic": "Calligraphic"
  };

  return {
    translations,
    translate: vi.fn((key: string) => translations[key] ?? key)
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

describe("NoteFormatToolbar", () => {
  beforeEach(() => {
    translate.mockClear();
  });

  describe("rendering and accessibility", () => {
    it("renders the expanded toolbar with its labelled controls", () => {
      renderNoteFormatToolbar();

      expect(screen.getByRole("toolbar", { name: "Format" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Bold" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Bullet list" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Superscript" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Font size" })).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByRole("button", { name: "Font" })).toHaveAttribute("aria-expanded", "false");
    });

    it("disables every action when formatting is unavailable", () => {
      renderNoteFormatToolbar({ formatState: createFormatState({ canFormat: false }) });

      screen.getAllByRole("button").forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("exposes active format and list states semantically", () => {
      renderNoteFormatToolbar({
        formatState: createFormatState({
          isBoldActive: true,
          isChecklistActive: true,
          isSuperscriptActive: true
        })
      });

      expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Checklist" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Superscript" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("expanded actions", () => {
    it.each([
      ["Bold", RichTextFormatCommand.BOLD],
      ["Italic", RichTextFormatCommand.ITALIC],
      ["Underline", RichTextFormatCommand.UNDERLINE],
      ["Strikethrough", RichTextFormatCommand.STRIKETHROUGH],
      ["Highlight", RichTextFormatCommand.HIGHLIGHT],
      ["Inline code", RichTextFormatCommand.INLINE_CODE],
      ["Bullet list", RichTextFormatCommand.BULLET_LIST],
      ["Dashed list", RichTextFormatCommand.DASHED_LIST],
      ["Numbered list", RichTextFormatCommand.NUMBERED_LIST],
      ["Checklist", RichTextFormatCommand.CHECKLIST],
      ["Superscript", RichTextFormatCommand.SUPERSCRIPT],
      ["Subscript", RichTextFormatCommand.SUBSCRIPT],
      ["Clear formatting", RichTextFormatCommand.CLEAR_FORMATTING]
    ])("sends %s to the editor", async (label, command) => {
      const user = userEvent.setup();
      const onFormatAction = vi.fn();

      renderNoteFormatToolbar({ onFormatAction });
      await user.click(screen.getByRole("button", { name: label }));

      expect(onFormatAction).toHaveBeenCalledExactlyOnceWith(command);
    });
  });

  describe("compact menus", () => {
    it("opens one menu at a time and dispatches a selected inline style", async () => {
      const user = userEvent.setup();
      const onFormatAction = vi.fn();

      renderNoteFormatToolbar({ compactInlineStyles: true, onFormatAction });

      await user.click(screen.getByRole("button", { name: "Format" }));
      expect(screen.getAllByRole("toolbar", { name: "Format" })).toHaveLength(2);

      await user.click(screen.getByRole("button", { name: "Lists" }));
      expect(screen.getAllByRole("toolbar", { name: "Format" })).toHaveLength(1);
      expect(screen.getByRole("toolbar", { name: "Lists" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Dashed list" }));

      expect(onFormatAction).toHaveBeenCalledExactlyOnceWith(RichTextFormatCommand.DASHED_LIST);
      expect(screen.queryByRole("toolbar", { name: "Lists" })).not.toBeInTheDocument();
    });

    it("omits superscript and subscript in compact mode", () => {
      renderNoteFormatToolbar({ compactInlineStyles: true });

      expect(screen.queryByRole("button", { name: "Superscript" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Subscript" })).not.toBeInTheDocument();
    });

    it("closes open menus on Escape and pointer interaction outside the toolbar", async () => {
      const user = userEvent.setup();

      renderNoteFormatToolbar({ compactInlineStyles: true });

      await user.click(screen.getByRole("button", { name: "Format" }));
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.getAllByRole("toolbar", { name: "Format" })).toHaveLength(1);

      await user.click(screen.getByRole("button", { name: "Lists" }));
      fireEvent.pointerDown(document.body);
      expect(screen.queryByRole("toolbar", { name: "Lists" })).not.toBeInTheDocument();
    });
  });

  describe("font size", () => {
    it("shows a dash for a mixed font-size selection", () => {
      renderNoteFormatToolbar({ formatState: createFormatState({ isFontSizeMixed: true }) });

      expect(screen.getByRole("button", { name: "Font size" })).toHaveTextContent("—");
    });

    it("selects a font size and closes its menu", async () => {
      const user = userEvent.setup();
      const onFormatAction = vi.fn();

      renderNoteFormatToolbar({ onFormatAction });
      await user.click(screen.getByRole("button", { name: "Font size" }));
      await user.click(screen.getByRole("menuitem", { name: "20" }));

      expect(onFormatAction).toHaveBeenCalledExactlyOnceWith({
        command: RichTextFormatCommand.FONT_SIZE,
        fontSize: 20
      });
      expect(screen.queryByRole("menu", { name: "Font size" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Font size" })).toHaveTextContent("20");
    });
  });

  describe("font family", () => {
    it("shows Multiple for mixed fonts in the expanded toolbar and Aa in compact mode", () => {
      const formatState = createFormatState({ isFontMixed: true });
      const { rerender } = renderNoteFormatToolbar({ formatState });

      expect(screen.getByRole("button", { name: "Font" })).toHaveTextContent("Multiple");

      rerender(createToolbarElement({ compactInlineStyles: true, formatState }));

      expect(screen.getByRole("button", { name: "Font" })).toHaveTextContent("Aa");
    });

    it("selects a font family and closes its menu", async () => {
      const user = userEvent.setup();
      const onFormatAction = vi.fn();

      renderNoteFormatToolbar({ onFormatAction });
      await user.click(screen.getByRole("button", { name: "Font" }));
      await user.click(screen.getByRole("menuitem", { name: "Lora" }));

      expect(onFormatAction).toHaveBeenCalledExactlyOnceWith({
        command: RichTextFormatCommand.FONT_FAMILY,
        noteFont: NoteFontPreference.LORA
      });
      expect(screen.queryByRole("menu", { name: "Font" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Font" })).toHaveTextContent("Lora");
    });
  });
});

function createFormatState(overrides?: Partial<RichTextFormatState>): RichTextFormatState {
  return {
    ...getInactiveRichTextFormatState(),
    canFormat: true,
    ...overrides
  };
}

function renderNoteFormatToolbar(props?: Partial<ComponentProps<typeof NoteFormatToolbar>>) {
  return render(createToolbarElement(props));
}

function createToolbarElement(props?: Partial<ComponentProps<typeof NoteFormatToolbar>>) {
  return (
    <NoteFormatToolbar
      formatState={createFormatState()}
      theme={SystemTheme.LIGHT}
      onFormatAction={vi.fn()}
      {...props}
    />
  );
}
