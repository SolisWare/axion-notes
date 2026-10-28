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

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      closeWindow: "Close window"
    })[key] ?? key
  })
}));

describe("NoteContextMenu", () => {
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
