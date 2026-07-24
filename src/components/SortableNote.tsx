/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { MouseEvent } from "react";
import Note from "./Note";
import { NoteType } from "../models/NoteType";
import { NoteFontPreference } from "../settings/NoteFontPreference";
import { NoteFontSize } from "../settings/NoteFontSize";
import { NoteSizePreference } from "../settings/noteSizePreference";
import { SystemTheme } from "../theme/SystemTheme";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";

type SortableNoteProps = {
  note: NoteType;
  theme: SystemTheme;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  noteFont: NoteFontPreference;
  noteTitleFont: NoteFontPreference;
  noteContentFontSize: NoteFontSize;
  noteTitleFontSize: NoteFontSize;
  richTextEditorEnabled: boolean;
  noteSize: NoteSizePreference;
  showNoteTitles: boolean;
  showNoteFooters: boolean;
  showFloatingFormatToolbar: boolean;
  handleDeleteNoteButton: (noteId: string) => void;
  handleDuplicateNote: (note: NoteType) => void;
  handleOpenNoteWindow?: (noteId: string) => void;
  handleMoveNoteToBottom: (noteId: string) => void;
  handleMoveNoteToTop: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
  handleToggleNotePin: (note: NoteType) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onEnterSelectionMode?: () => void;
  onSelectSelection?: (noteId: string) => void;
  onDeselectSelection?: (noteId: string) => void;
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

function SortableNote(props: SortableNoteProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.note.id });

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
    props.onToggleSelection?.(props.note.id);
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.72 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : undefined
      }}
      {...attributes}
      {...listeners}
      onMouseDownCapture={handleSelectionMouseDown}
      onClickCapture={handleSelectionClick}
    >
      <Note
        theme={props.theme}
        note={props.note}
        dateFormat={props.dateFormat}
        timeFormat={props.timeFormat}
        noteFont={props.noteFont}
        noteTitleFont={props.noteTitleFont}
        noteContentFontSize={props.noteContentFontSize}
        noteTitleFontSize={props.noteTitleFontSize}
        richTextEditorEnabled={props.richTextEditorEnabled}
        noteSize={props.noteSize}
        showNoteTitles={props.showNoteTitles}
        showNoteFooters={props.showNoteFooters}
        showFloatingFormatToolbar={props.showFloatingFormatToolbar}
        handleNoteSave={props.handleNoteSave}
        handleDeleteNoteButton={props.handleDeleteNoteButton}
        handleDuplicateNote={props.handleDuplicateNote}
        handleOpenNoteWindow={props.handleOpenNoteWindow}
        handleMoveNoteToBottom={props.handleMoveNoteToBottom}
        handleMoveNoteToTop={props.handleMoveNoteToTop}
        handleToggleNotePin={props.handleToggleNotePin}
        isSelectionMode={props.isSelectionMode}
        isSelected={props.isSelected}
        onEnterSelectionMode={props.onEnterSelectionMode}
        onSelectSelection={props.onSelectSelection}
        onDeselectSelection={props.onDeselectSelection}
        onToggleSelection={props.onToggleSelection}
      />
    </div>
  );
}

export default SortableNote;
