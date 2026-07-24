/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { MouseEvent, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./NoteList.module.css";

type SortableNoteListItemProps = {
  children: ReactNode;
  id: string;
  isFolded: boolean;
  onToggleSelection?: (noteId: string) => void;
};

const NOTE_SELECTION_IGNORED_TARGET_SELECTOR = [
  "button",
  "[role='button']",
  "[data-note-context-menu='true']"
].join(",");

function isSelectionIgnoredTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(NOTE_SELECTION_IGNORED_TARGET_SELECTOR) !== null;
}

function SortableNoteListItem(props: SortableNoteListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id });

  function isSelectionClick(event: MouseEvent<HTMLDivElement>): boolean {
    return event.button === 0
      && (event.metaKey || event.ctrlKey)
      && !isSelectionIgnoredTarget(event.target);
  }

  function handleSelectionMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (!isSelectionClick(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  function handleSelectionClick(event: MouseEvent<HTMLDivElement>) {
    if (!isSelectionClick(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    props.onToggleSelection?.(props.id);
  }

  return (
    <div
      className={props.isFolded ? styles.sortableFoldedItem : styles.sortableExpandedItem}
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.72 : 1,
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined
      }}
      {...attributes}
      {...listeners}
      onMouseDownCapture={handleSelectionMouseDown}
      onClickCapture={handleSelectionClick}
    >
      {props.children}
    </div>
  );
}

export default SortableNoteListItem;
