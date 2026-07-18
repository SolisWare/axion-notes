/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./NoteList.module.css";

type SortableNoteListItemProps = {
  children: ReactNode;
  id: string;
  isFolded: boolean;
};

function SortableNoteListItem(props: SortableNoteListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.id });

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
    >
      {props.children}
    </div>
  );
}

export default SortableNoteListItem;
