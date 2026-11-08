/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render } from "@testing-library/react";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FloatingNoteFormatToolbar from "../../../../src/components/FloatingNoteFormatToolbar";
import { NoteFontPreference } from "../../../../src/settings/NoteFontPreference";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { RichTextFormatCommand } from "../../../../src/types/RichTextFormatCommand";
import { RichTextFormatState } from "../../../../src/types/RichTextFormatState";

const noteFormatToolbarMock = vi.hoisted(() => ({
  forwardedProps: [] as unknown[],
  render: (props: unknown) => {
    noteFormatToolbarMock.forwardedProps.push(props);
    return null;
  }
}));

vi.mock("../../../../src/components/NoteFormatToolbar", () => ({
  default: noteFormatToolbarMock.render
}));

describe("FloatingNoteFormatToolbar", () => {
  beforeEach(() => {
    noteFormatToolbarMock.forwardedProps.splice(0);
  });

  it("does not render or initialize the child toolbar while formatting is unavailable", () => {
    renderFloatingNoteFormatToolbar({ formatState: createFormatState({ canFormat: false }) });

    expect(noteFormatToolbarMock.forwardedProps).toEqual([]);
  });

  it("renders the child toolbar with the floating compact presentation", () => {
    const onFormatAction = vi.fn();
    const formatState = createFormatState();

    renderFloatingNoteFormatToolbar({ formatState, onFormatAction });

    expect(noteFormatToolbarMock.forwardedProps).toHaveLength(1);
    expect(getForwardedProps()).toMatchObject({
      compactInlineStyles: true,
      formatState,
      onFormatAction,
      surfaceColor: "#fff7a8",
      theme: SystemTheme.DARK
    });
    expect(getForwardedProps().className).toEqual(expect.any(String));
  });

  it("preserves the format action callback for commands issued by the child toolbar", () => {
    const onFormatAction = vi.fn();

    renderFloatingNoteFormatToolbar({ onFormatAction });

    getForwardedProps().onFormatAction(RichTextFormatCommand.BOLD);

    expect(onFormatAction).toHaveBeenCalledOnce();
    expect(onFormatAction).toHaveBeenCalledWith(RichTextFormatCommand.BOLD);
  });

  it("forwards updated formatting state and surface color after rerendering", () => {
    const initialFormatState = createFormatState();
    const updatedFormatState = createFormatState({
      activeFont: NoteFontPreference.SERIF,
      activeFontSize: 24,
      isBoldActive: true,
      isFontMixed: true,
      isFontSizeMixed: true
    });
    const { rerender } = renderFloatingNoteFormatToolbar({ formatState: initialFormatState, surfaceColor: "#fff7a8" });

    rerender(createFloatingNoteFormatToolbar({ formatState: updatedFormatState, surfaceColor: "#d2f0ff" }));

    expect(noteFormatToolbarMock.forwardedProps).toHaveLength(2);
    expect(getForwardedProps()).toMatchObject({
      formatState: updatedFormatState,
      surfaceColor: "#d2f0ff"
    });
  });
});

function renderFloatingNoteFormatToolbar(props?: Partial<ComponentProps<typeof FloatingNoteFormatToolbar>>) {
  return render(createFloatingNoteFormatToolbar(props));
}

function createFloatingNoteFormatToolbar(props?: Partial<ComponentProps<typeof FloatingNoteFormatToolbar>>) {
  return (
    <FloatingNoteFormatToolbar
      formatState={createFormatState()}
      surfaceColor="#fff7a8"
      theme={SystemTheme.DARK}
      onFormatAction={vi.fn()}
      {...props}
    />
  );
}

function getForwardedProps(): {
  className: string;
  compactInlineStyles: boolean;
  formatState: RichTextFormatState;
  onFormatAction: (command: RichTextFormatCommand) => void;
  surfaceColor: string;
  theme: SystemTheme;
} {
  const props = noteFormatToolbarMock.forwardedProps.at(-1);

  if (!props) {
    throw new Error("Expected FloatingNoteFormatToolbar to render NoteFormatToolbar.");
  }

  return props as ReturnType<typeof getForwardedProps>;
}

function createFormatState(overrides: Partial<RichTextFormatState> = {}): RichTextFormatState {
  return {
    activeFont: NoteFontPreference.SYSTEM,
    activeFontSize: 14,
    canFormat: true,
    isBoldActive: false,
    isBulletListActive: false,
    isChecklistActive: false,
    isDashedListActive: false,
    isFontMixed: false,
    isFontSizeMixed: false,
    isHighlightActive: false,
    isInlineCodeActive: false,
    isItalicActive: false,
    isNumberedListActive: false,
    isStrikethroughActive: false,
    isSubscriptActive: false,
    isSuperscriptActive: false,
    isUnderlineActive: false,
    ...overrides
  };
}
