/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import Note from "./Note";
import { NoteType } from "../models/NoteType";
import { NoteFontPreference } from "../settings/NoteFontPreference";
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
};

function SortableNote(props: SortableNoteProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.note.id });

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
    >
      <Note
        theme={props.theme}
        note={props.note}
        dateFormat={props.dateFormat}
        timeFormat={props.timeFormat}
        noteFont={props.noteFont}
        noteTitleFont={props.noteTitleFont}
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
      />
    </div>
  );
}

export default SortableNote;
