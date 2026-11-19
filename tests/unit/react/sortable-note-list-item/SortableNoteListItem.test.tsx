/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SortableNoteListItem from "../../../../src/components/SortableNoteListItem";

const { setNodeRef, sortableState, useSortable } = vi.hoisted(() => ({
  setNodeRef: vi.fn(),
  sortableState: {
    attributes: { "data-sortable-id": "", "data-testid": "sortable-note" },
    isDragging: false,
    listeners: { onPointerDown: vi.fn() },
    transform: null as { x: number; y: number } | null,
    transition: undefined as string | undefined
  },
  useSortable: vi.fn()
}));

vi.mock("@dnd-kit/sortable", () => ({ useSortable }));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Translate: {
      toString: (transform: { x: number; y: number } | null) => transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
    }
  }
}));
vi.mock("../../../../src/components/NoteList.module.css", () => ({
  default: {
    sortableExpandedItem: "sortable-expanded-item",
    sortableFoldedItem: "sortable-folded-item"
  }
}));

describe("SortableNoteListItem", () => {
  beforeEach(() => {
    sortableState.attributes = { "data-sortable-id": "", "data-testid": "sortable-note" };
    sortableState.isDragging = false;
    sortableState.listeners = { onPointerDown: vi.fn() };
    sortableState.transform = null;
    sortableState.transition = undefined;
    setNodeRef.mockClear();
    useSortable.mockReturnValue({ ...sortableState, setNodeRef });
  });

  it("registers its id with dnd-kit, forwards its attributes and listeners, and renders children", () => {
    const onPointerDown = vi.fn();
    sortableState.attributes = { "aria-describedby": "drag-instructions", "data-sortable-id": "note-1", "data-testid": "sortable-note" };
    sortableState.listeners = { onPointerDown };
    useSortable.mockReturnValue({ ...sortableState, setNodeRef });

    renderSortableNoteListItem();

    const item = screen.getByTestId("sortable-note");
    expect(useSortable).toHaveBeenCalledWith({ id: "note-1" });
    expect(item).toHaveAttribute("data-sortable-id", "note-1");
    expect(item).toHaveAttribute("aria-describedby", "drag-instructions");
    expect(item).toHaveTextContent("Note content");
    expect(setNodeRef).toHaveBeenCalledWith(item);

    fireEvent.pointerDown(item);
    expect(onPointerDown).toHaveBeenCalledOnce();
  });

  it("uses the folded and expanded item styles according to note state", () => {
    const { rerender } = renderSortableNoteListItem({ isFolded: true });
    expect(screen.getByTestId("sortable-note")).toHaveClass("sortable-folded-item");

    rerender(<SortableNoteListItem id="note-1" isFolded={false}><span>Note content</span></SortableNoteListItem>);
    expect(screen.getByTestId("sortable-note")).toHaveClass("sortable-expanded-item");
  });

  it("reflects dnd-kit transform, transition, and dragging state in inline styles", () => {
    sortableState.isDragging = true;
    sortableState.transform = { x: 24, y: -12 };
    sortableState.transition = "transform 150ms ease";
    useSortable.mockReturnValue({ ...sortableState, setNodeRef });

    renderSortableNoteListItem();

    const item = screen.getByTestId("sortable-note");
    expect(item).toHaveStyle({
      opacity: "0.72",
      transform: "translate3d(24px, -12px, 0)",
      transition: "transform 150ms ease",
      zIndex: "1"
    });
  });

  it("keeps normal opacity and stacking when it is not being dragged", () => {
    renderSortableNoteListItem();

    const item = screen.getByTestId("sortable-note");
    expect(item).toHaveStyle({ opacity: "1" });
    expect(item.style.transform).toBe("");
    expect(item.style.transition).toBe("");
    expect(item.style.zIndex).toBe("");
  });
});

function renderSortableNoteListItem({ isFolded = false }: { isFolded?: boolean } = {}) {
  return render(
    <SortableNoteListItem id="note-1" isFolded={isFolded}>
      <span>Note content</span>
    </SortableNoteListItem>
  );
}
